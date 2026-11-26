package com.gestorgastos.routes

import com.gestorgastos.models.PdfResponse
import com.gestorgastos.models.ConfirmarImportacionRequest
import com.gestorgastos.repositories.GastoRepository
import com.gestorgastos.services.importaciones.PdfReader
import com.gestorgastos.services.importaciones.ProcesadorEstadoCuenta
import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.utils.io.*
import kotlinx.io.readByteArray
import java.io.IOException
import com.gestorgastos.models.esMontoValido
import java.time.LocalDate
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException

fun Route.importacionesRoutes() {

    val pdfReader = PdfReader()
    val procesador = ProcesadorEstadoCuenta()
    val repository = GastoRepository()

    val maxBytes = 10L * 1024 * 1024

    route("/importaciones") {

        // Procesar estado de cuenta PDF
        post("/pdf") {

            val multipart = call.receiveMultipart(
                formFieldLimit = maxBytes
            )

            var contenido: ByteArray? = null
            var nombreArchivo = ""

            multipart.forEachPart { part ->
                try {
                    if (
                        part is PartData.FileItem &&
                        part.name == "archivo" &&
                        contenido == null
                    ) {
                        nombreArchivo =
                            part.originalFileName.orEmpty()

                        contenido = part.provider()
                            .readRemaining(maxBytes + 1)
                            .readByteArray()
                    }
                } finally {
                    part.dispose()
                }
            }

            val archivo = contenido

            if (archivo == null || archivo.isEmpty()) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "No se recibió ningún archivo")
                )
                return@post
            }

            if (archivo.size > maxBytes) {
                call.respond(
                    HttpStatusCode.PayloadTooLarge,
                    mapOf("error" to "El archivo supera los 10 MB")
                )
                return@post
            }

            if (!nombreArchivo.endsWith(".pdf", ignoreCase = true)) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "Solo se permiten archivos PDF")
                )
                return@post
            }

            val texto = try {
                pdfReader.extraerTexto(archivo)
            } catch (e: InvalidPasswordException) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "El PDF está protegido con contraseña")
                )
                return@post
            } catch (e: IOException) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "No se pudo leer el PDF")
                )
                return@post
            }

            if (texto.isBlank()) {
                call.respond(
                    HttpStatusCode.UnprocessableEntity,
                    mapOf("error" to "El PDF no contiene texto extraíble")
                )
                return@post
            }
println("========== TEXTO PDF ==========")
println(texto)
println("================================")
            val movimientos = try {
                
                procesador.procesar(texto)
                
            } catch (e: IllegalArgumentException) {
                call.respond(
                    HttpStatusCode.UnprocessableEntity,
                    mapOf("error" to "Formato no reconocido o datos inválidos")
                )
                return@post
            }

            if (movimientos.isEmpty()) {
                call.respond(
                    HttpStatusCode.UnprocessableEntity,
                    mapOf("error" to "No se encontraron movimientos")
                )
                return@post
            }

            call.respond(
                PdfResponse(
                    nombreArchivo = nombreArchivo,
                    texto = texto,
                    movimientos = movimientos,
                    totalMovimientos = movimientos.size,
                    montoTotal = movimientos.sumOf {
                        it.monto
                    }
                )
            )
        }

        // Confirmar y guardar movimientos
        post("/confirmar") {

            val request =
                call.receive<ConfirmarImportacionRequest>()

            if (request.movimientos.isEmpty()) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "No hay movimientos para importar")
                )
                return@post
            }

            val invalidos = request.movimientos.any {
                it.comercio.isBlank() ||
                it.comercio.length > 255 ||
                !it.monto.esMontoValido() ||
                it.categoria.isBlank() ||
                it.categoria.length > 100 ||
                it.banco.isBlank() ||
                it.banco.length > 100 ||
                runCatching {
                    LocalDate.parse(it.fechaCargo)
                }.isFailure ||
                (
                    it.ultimosDigitos != null &&
                    !it.ultimosDigitos.matches(Regex("""\d{4}"""))
                )
            }

            if (invalidos) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "Existen movimientos inválidos")
                )
                return@post
            }

            val resultado = repository.importarMovimientos(
                request.movimientos,
                request.permitirCoincidencias
            )

            if (
                resultado.posiblesDuplicados.isNotEmpty() &&
                !request.permitirCoincidencias
            ) {
                call.respond(
                    HttpStatusCode.Conflict,
                    resultado
                )
                return@post
            }

            call.respond(
                HttpStatusCode.Created,
                resultado
            )
        }
    }
}