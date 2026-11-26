package com.gestorgastos

import com.gestorgastos.routes.gastosRoutes
import com.gestorgastos.routes.importacionesRoutes
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {

    routing {

        get("/") {
            call.respondText("Hello, World!")
        }

        get("/json/kotlinx-serialization") {
            call.respond(mapOf("hello" to "world"))
        }

        gastosRoutes()

        importacionesRoutes()
    }
}