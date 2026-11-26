package com.gestorgastos.routes

import com.gestorgastos.models.GuardarSuscripcionRequest
import com.gestorgastos.services.SuscripcionService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.*

fun Route.suscripcionesRoutes() {
    val servicio = SuscripcionService()

    route("/suscripciones") {
        get { call.respond(servicio.listar()) }

        get("/resumen") { call.respond(servicio.resumen()) }

        get("/{id}") {
            val id = call.idSuscripcion() ?: return@get
            val suscripcion = servicio.obtener(id) ?: return@get call.suscripcionNoEncontrada()
            call.respond(suscripcion)
        }

        post {
            val datos = call.recibirSuscripcion(servicio) ?: return@post
            call.respond(HttpStatusCode.Created, servicio.crear(datos))
        }

        put("/{id}") {
            val id = call.idSuscripcion() ?: return@put
            val datos = call.recibirSuscripcion(servicio) ?: return@put
            val suscripcion = servicio.actualizar(id, datos) ?: return@put call.suscripcionNoEncontrada()
            call.respond(suscripcion)
        }

        delete("/{id}") {
            val id = call.idSuscripcion() ?: return@delete
            if (servicio.eliminar(id)) call.respond(HttpStatusCode.NoContent)
            else call.suscripcionNoEncontrada()
        }
    }
}

private suspend fun ApplicationCall.idSuscripcion(): Int? {
    val id = parameters["id"]?.toIntOrNull()?.takeIf { it > 0 }
    if (id == null) respond(HttpStatusCode.BadRequest, mapOf("error" to "El identificador es inválido"))
    return id
}

private suspend fun ApplicationCall.suscripcionNoEncontrada() {
    respond(HttpStatusCode.NotFound, mapOf("error" to "La suscripción no existe"))
}

private suspend fun ApplicationCall.recibirSuscripcion(servicio: SuscripcionService): GuardarSuscripcionRequest? {
    val datos = receive<GuardarSuscripcionRequest>()
    val errores = servicio.validar(datos)
    if (errores.isEmpty()) return datos
    respond(HttpStatusCode.BadRequest, mapOf("errores" to errores))
    return null
}
