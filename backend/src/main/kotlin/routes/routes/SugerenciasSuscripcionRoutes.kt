package com.gestorgastos.routes

import com.gestorgastos.models.ConfirmarSugerenciaRequest
import com.gestorgastos.repositories.ConfirmacionInvalida
import com.gestorgastos.repositories.SugerenciaNoDisponible
import com.gestorgastos.repositories.SugerenciaSuscripcionRepository
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.*

private val formatoSugerencia = Regex("[0-9a-f]{64}")

internal fun Route.sugerenciasSuscripcionRoutes() {
    val repo = SugerenciaSuscripcionRepository()
    route("/sugerencias") {
        get { call.respond(repo.consultar()) }
        post("/analizar") { call.respond(repo.consultar()) }
        post("/{id}/confirmar") {
            val id = call.idSugerencia() ?: return@post
            val datos = call.receive<ConfirmarSugerenciaRequest>()
            try {
                call.respond(HttpStatusCode.Created, repo.confirmar(id, datos))
            } catch (e: ConfirmacionInvalida) {
                call.respond(HttpStatusCode.BadRequest, mapOf("errores" to e.errores))
            } catch (e: SugerenciaNoDisponible) {
                call.sugerenciaNoDisponible()
            }
        }
        post("/{id}/descartar") {
            val id = call.idSugerencia() ?: return@post
            try {
                repo.descartar(id)
                call.respond(HttpStatusCode.NoContent)
            } catch (e: SugerenciaNoDisponible) {
                call.sugerenciaNoDisponible()
            }
        }
    }
}

private suspend fun ApplicationCall.idSugerencia(): String? {
    val id = parameters["id"]?.takeIf(formatoSugerencia::matches)
    if (id == null) respond(HttpStatusCode.BadRequest, mapOf("error" to "El identificador de sugerencia es inválido"))
    return id
}

private suspend fun ApplicationCall.sugerenciaNoDisponible() =
    respond(HttpStatusCode.Conflict, mapOf("error" to "La sugerencia cambió o ya fue revisada. Vuelve a analizar los movimientos."))
