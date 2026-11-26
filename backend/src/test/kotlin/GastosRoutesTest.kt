package com.gestorgastos

import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals

class GastosRoutesTest {

    @Test
    fun `la consulta rechaza filtros y paginacion invalidos`() = testApplication {
        application {
            configureSerialization()
            configureRouting()
        }

        val consultas = listOf(
            "pagina=-1",
            "tamanoPagina=101",
            "ordenarPor=origen",
            "direccion=invalida",
            "fechaDesde=2026-02-30",
            "fechaDesde=2026-02-02&fechaHasta=2026-02-01",
            "montoMinimo=1.234",
            "montoMinimo=10.50&montoMaximo=10.49",
            "tipoTarjeta=OTRO",
            "origen=OTRO",
            "ultimosDigitos=123"
        )
        for (consulta in consultas) {
            assertEquals(HttpStatusCode.BadRequest, client.get("/gastos?$consulta").status, consulta)
        }
    }

    @Test
    fun `la edicion y la eliminacion rechazan datos invalidos antes de escribir`() = testApplication {
        application {
            configureSerialization()
            configureRouting()
        }

        assertEquals(HttpStatusCode.BadRequest, client.delete("/gastos/0").status)
        assertEquals(HttpStatusCode.BadRequest, client.put("/gastos/invalido").status)
        assertEquals(HttpStatusCode.BadRequest, client.put("/gastos/1") {
            contentType(ContentType.Application.Json)
            setBody("""{"comercio":"Comercio ficticio","monto":"0","categoria":"Otros","fechaCargo":"2026-11-24"}""")
        }.status)

        for (cuerpo in listOf("""{"ids":[]}""", """{"ids":[1,-2]}""")) {
            assertEquals(HttpStatusCode.BadRequest, client.post("/gastos/eliminacion-multiple") {
                contentType(ContentType.Application.Json)
                setBody(cuerpo)
            }.status)
        }
    }
}
