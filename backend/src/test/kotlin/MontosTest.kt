package com.gestorgastos

import com.gestorgastos.models.MovimientoExtraido
import com.gestorgastos.models.esMontoValido
import com.gestorgastos.serialization.BigDecimalSerializer
import com.gestorgastos.services.importaciones.ProcesadorEstadoCuenta
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.math.BigDecimal
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class MontosTest {

    private val movimientoJson = """
        {"comercio":"Comercio ficticio","monto":"95.50","categoria":"Alimentación",
        "banco":"Nu","fechaCargo":"2026-11-24","tipoTarjeta":"CREDITO","ultimosDigitos":"1234"}
    """.trimIndent()

    @Test
    fun `el contrato representa los decimales como cadenas`() {
        val movimiento = Json.decodeFromString<MovimientoExtraido>(movimientoJson)
        assertEquals(BigDecimal("95.50"), movimiento.monto)

        val monto = Json.parseToJsonElement(Json.encodeToString(movimiento))
            .jsonObject.getValue("monto").jsonPrimitive
        assertTrue(monto.isString)
        assertEquals("95.50", monto.content)

        for (entrada in listOf("95.50", "\"95,50\"", "\"1e2\"", "null")) {
            assertFailsWith<SerializationException> {
                Json.decodeFromString(BigDecimalSerializer, entrada)
            }
        }
    }

    @Test
    fun `la validacion aplica la escala y el limite de PostgreSQL`() {
        for (monto in listOf("0.01", "95.5", "95.50", "9999999999.99")) {
            assertTrue(BigDecimal(monto).esMontoValido(), monto)
        }
        for (monto in listOf("0.00", "-1.00", "95.500", "0.001", "10000000000.00")) {
            assertFalse(BigDecimal(monto).esMontoValido(), monto)
        }
    }

    @Test
    fun `ambas rutas rechazan montos invalidos antes de guardar`() = testApplication {
        application {
            configureSerialization()
            configureRouting()
        }
        for (monto in listOf("0.00", "-1.00", "95.501", "10000000000.00", "95,50")) {
            val movimiento = movimientoJson.replace("95.50", monto)
            assertEquals(HttpStatusCode.BadRequest, client.post("/gastos") {
                contentType(ContentType.Application.Json)
                setBody(movimiento)
            }.status, monto)
            assertEquals(HttpStatusCode.BadRequest, client.post("/importaciones/confirmar") {
                contentType(ContentType.Application.Json)
                setBody("""{"movimientos":[$movimiento]}""")
            }.status, monto)
        }
    }

    @Test
    fun `los estados de cuenta sinteticos mantienen sus importes exactos`() {
        val nu = """
            Tarjeta de Crédito Nu
            CARGOS, ABONOS Y COMPRAS REGULARES (NO A MESES)
            24 NOV 2026 24 NOV 2026 Comercio ficticio + $1,234.50
            Tarjeta virtual **** 1234
            24 NOV 2026 24 NOV 2026 Otro comercio + $0.10
            24 NOV 2026 24 NOV 2026 Pago ficticio - $20.00
            24 NOV 2026 24 NOV 2026 Cargo en cero + $0.00
            Total de cargos
        """.trimIndent()
        val bancoPrueba = """
            BANCO DE PRUEBA
            24/11/2026 Comercio ficticio $9,999,999,999.99
            24/11/2026 Otro comercio $0.01
        """.trimIndent()
        val procesador = ProcesadorEstadoCuenta()
        val movimientosNu = procesador.procesar(nu)
        assertEquals(listOf(BigDecimal("1234.50"), BigDecimal("0.10")), movimientosNu.map { it.monto })
        assertEquals("1234", movimientosNu.first().ultimosDigitos)
        assertEquals(BigDecimal("1234.60"), movimientosNu.sumOf { it.monto })

        val movimientosPrueba = procesador.procesar(bancoPrueba)
        assertEquals(BigDecimal("10000000000.00"), movimientosPrueba.sumOf { it.monto })
        assertFailsWith<IllegalArgumentException> {
            procesador.procesar(bancoPrueba.replace("9,999,999,999.99", "10,000,000,000.00"))
        }
    }
}
