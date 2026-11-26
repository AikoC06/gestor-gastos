package com.gestorgastos.routes

import com.gestorgastos.enums.OrigenMovimiento
import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.models.*
import com.gestorgastos.repositories.GastoRepository
import io.ktor.http.*
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.time.LocalDate
import java.time.format.DateTimeParseException

private val cuatroDigitos = Regex("""[0-9]{4}""")

fun Route.gastosRoutes() {
    val repository = GastoRepository()

    route("/gastos") {
        get {
            val consulta = try {
                call.request.queryParameters.aConsultaGastos()
            } catch (e: IllegalArgumentException) {
                return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message.orEmpty()))
            }
            call.respond(repository.consultar(consulta))
        }

        post {
            val gasto = call.recibirGastoValido() ?: return@post
            val id = repository.crear(gasto)
            call.respond(HttpStatusCode.Created, mapOf("id" to id))
        }

        put("/{id}") {
            val id = call.recibirId() ?: return@put
            val gasto = call.recibirGastoValido() ?: return@put
            if (repository.actualizar(id, gasto)) {
                call.respond(HttpStatusCode.NoContent)
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "El movimiento no existe"))
            }
        }

        delete("/{id}") {
            val id = call.recibirId() ?: return@delete
            if (repository.eliminar(listOf(id)) > 0) {
                call.respond(HttpStatusCode.NoContent)
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "El movimiento no existe"))
            }
        }

        post("/eliminacion-multiple") {
            val request = call.receive<EliminarGastosRequest>()
            if (request.ids.isEmpty() || request.ids.any { it <= 0 }) {
                return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Selecciona movimientos válidos"))
            }
            call.respond(mapOf("eliminados" to repository.eliminar(request.ids)))
        }
    }
}

private suspend fun ApplicationCall.recibirId(): Int? {
    val id = parameters["id"]?.toIntOrNull()?.takeIf { it > 0 }
    if (id == null) respond(HttpStatusCode.BadRequest, mapOf("error" to "El identificador es inválido"))
    return id
}

private suspend fun ApplicationCall.recibirGastoValido(): CrearGastoRequest? {
    val gasto = receive<CrearGastoRequest>()
    val errores = listOfNotNull(
        "El comercio es inválido".takeIf { gasto.comercio.isBlank() || gasto.comercio.length > 255 },
        "El monto es inválido".takeUnless { gasto.monto.esMontoValido() },
        "La categoría es inválida".takeIf { gasto.categoria.isBlank() || gasto.categoria.length > 100 },
        "La fecha es inválida".takeIf { runCatching { LocalDate.parse(gasto.fechaCargo) }.isFailure },
        "El banco es inválido".takeIf { (gasto.banco?.length ?: 0) > 100 },
        "Los últimos dígitos son inválidos".takeIf { gasto.ultimosDigitos?.matches(cuatroDigitos) == false }
    )
    if (errores.isEmpty()) return gasto
    respond(HttpStatusCode.BadRequest, mapOf("errores" to errores))
    return null
}

private fun Parameters.aConsultaGastos(): ConsultaGastos {
    val fechaDesde = leer("fechaDesde", ::fecha)
    val fechaHasta = leer("fechaHasta", ::fecha)
    require(fechaDesde == null || fechaHasta == null || fechaDesde <= fechaHasta) { "El rango de fechas es inválido" }

    val montoMinimo = leer("montoMinimo", ::montoFiltro)
    val montoMaximo = leer("montoMaximo", ::montoFiltro)
    require(montoMinimo == null || montoMaximo == null || montoMinimo <= montoMaximo) { "El rango de montos es inválido" }

    return ConsultaGastos(
        comercio = leer("comercio") { it.takeIf { it.length <= 255 } },
        fechaDesde = fechaDesde,
        fechaHasta = fechaHasta,
        categoria = leer("categoria") { it.takeIf { it.length <= 100 } },
        banco = leer("banco") { it.takeIf { it.length <= 100 } },
        tipoTarjeta = leer("tipoTarjeta") { valor -> TipoTarjeta.entries.find { it.name == valor } },
        ultimosDigitos = leer("ultimosDigitos") { it.takeIf(cuatroDigitos::matches) },
        origen = leer("origen") { valor -> OrigenMovimiento.entries.find { it.name == valor } },
        montoMinimo = montoMinimo,
        montoMaximo = montoMaximo,
        ordenarPor = leer("ordenarPor") { valor -> OrdenGastos.entries.find { it.name.equals(valor, ignoreCase = true) } }
            ?: OrdenGastos.FECHA,
        ascendente = leer("direccion") { it.takeIf { it == "asc" || it == "desc" } } == "asc",
        pagina = leer("pagina") { it.toIntOrNull()?.takeIf { pagina -> pagina >= 0 } } ?: 0,
        tamanoPagina = leer("tamanoPagina") { it.toIntOrNull()?.takeIf { tamano -> tamano in 1..100 } } ?: 10
    )
}

private fun <T : Any> Parameters.leer(nombre: String, convertir: (String) -> T?): T? =
    this[nombre]?.trim()?.takeIf(String::isNotEmpty)?.let {
        requireNotNull(convertir(it)) { "El parámetro $nombre es inválido" }
    }

private fun fecha(valor: String): LocalDate? = try {
    LocalDate.parse(valor)
} catch (e: DateTimeParseException) {
    null
}

private val decimalFiltro = Regex("""[0-9]+(?:\.[0-9]{1,2})?""")

private fun montoFiltro(valor: String) = valor.takeIf(decimalFiltro::matches)?.toBigDecimalOrNull()
    ?.takeIf { it.signum() == 0 || it.esMontoValido() }
