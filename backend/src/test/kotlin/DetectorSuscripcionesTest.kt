package com.gestorgastos

import com.gestorgastos.enums.EstadoSuscripcion
import com.gestorgastos.enums.FrecuenciaSuscripcion
import com.gestorgastos.enums.OrigenSuscripcion
import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.models.ConfianzaSuscripcion
import com.gestorgastos.models.Suscripcion
import com.gestorgastos.services.suscripciones.DetectorSuscripciones
import com.gestorgastos.services.suscripciones.MovimientoDeteccion
import java.math.BigDecimal
import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class DetectorSuscripcionesTest {
    private val detector = DetectorSuscripciones()

    @Test
    fun `reconoce una variante conocida sin asumir frecuencia ni fecha futura`() {
        val sugerencia = detector.detectar(listOf(movimiento(1, "PayPal * GOOGLE ONE"))).single()
        assertEquals("Google One", sugerencia.nombre)
        assertEquals(ConfianzaSuscripcion.MEDIA, sugerencia.confianza)
        assertNull(sugerencia.frecuenciaEstimada)
        assertNull(sugerencia.proximoCobroEstimado)
        assertEquals(listOf(1), sugerencia.movimientosIds)
    }

    @Test
    fun `genera una sugerencia por categoria con un movimiento`() {
        val sugerencia = detector.detectar(listOf(movimiento(1, categoria = "Suscripciones"))).single()
        assertEquals(ConfianzaSuscripcion.BAJA, sugerencia.confianza)
        assertNull(sugerencia.frecuenciaEstimada)
    }

    @Test
    fun `detecta las siete frecuencias por calendario`() {
        val casos = mapOf(
            FrecuenciaSuscripcion.SEMANAL to listOf("2026-01-01", "2026-01-08", "2026-01-15"),
            FrecuenciaSuscripcion.QUINCENAL to listOf("2026-01-01", "2026-01-16", "2026-01-31"),
            FrecuenciaSuscripcion.MENSUAL to listOf("2026-01-01", "2026-02-01", "2026-03-01"),
            FrecuenciaSuscripcion.BIMESTRAL to listOf("2026-01-01", "2026-03-01", "2026-05-01"),
            FrecuenciaSuscripcion.TRIMESTRAL to listOf("2026-01-01", "2026-04-01", "2026-07-01"),
            FrecuenciaSuscripcion.SEMESTRAL to listOf("2025-01-01", "2025-07-01", "2026-01-01"),
            FrecuenciaSuscripcion.ANUAL to listOf("2025-05-03", "2026-05-06")
        )
        casos.forEach { (frecuencia, fechas) ->
            val movimientos = fechas.mapIndexed { indice, fecha -> movimiento(indice + 1, fecha = fecha) }
            val sugerencia = detector.detectar(movimientos.reversed()).single()
            assertEquals(frecuencia, sugerencia.frecuenciaEstimada)
            assertEquals(movimientos.map { it.id }, sugerencia.movimientosIds)
        }
    }

    @Test
    fun `tolera variaciones de fecha y un aumento de precio`() {
        val sugerencia = detector.detectar(listOf(
            movimiento(1, fecha = "2026-01-28", monto = "100.00"),
            movimiento(2, fecha = "2026-02-26", monto = "101.00"),
            movimiento(3, fecha = "2026-03-29", monto = "125.00")
        )).single()
        assertEquals(FrecuenciaSuscripcion.MENSUAL, sugerencia.frecuenciaEstimada)
        assertEquals(BigDecimal("125.00"), sugerencia.montoEstimado)
        assertEquals("2026-04-29", sugerencia.proximoCobroEstimado)
    }

    @Test
    fun `estima el ultimo dia cuando los cargos ocurren al cierre de mes`() {
        val movimientos = listOf("2025-12-31", "2026-01-31", "2026-02-28").mapIndexed { i, fecha ->
            movimiento(i + 1, fecha = fecha)
        }
        assertEquals("2026-03-31", detector.detectar(movimientos).single().proximoCobroEstimado)
    }

    @Test
    fun `excluye compras irregulares pagos de tarjeta y parcialidades aun si tienen categoria`() {
        val pagos = listOf("2026-01-02", "2026-02-02", "2026-03-02").flatMapIndexed { indice, fecha ->
            listOf(
                movimiento(indice * 3, "Netflix MSI", fecha, categoria = "Suscripciones"),
                movimiento(indice * 3 + 1, "Electrónica 0${indice + 1}/12", fecha),
                movimiento(indice * 3 + 2, "Pago tarjeta", fecha, categoria = "Suscripciones")
            )
        }
        assertTrue(detector.detectar(pagos + listOf(
            movimiento(10, "Amazon Marketplace"),
            movimiento(11, "Amazon Marketplace", "2026-01-11"),
            movimiento(12, "Amazon Marketplace", "2026-03-01"),
            movimiento(13, "Amazon Marketplace", "2026-03-03")
        )).isEmpty())
    }

    @Test
    fun `conserva tarjetas separadas y el ID al llegar nuevos cargos`() {
        val primera = movimiento(1, "NETFLIX", digitos = "0012")
        val segunda = movimiento(2, "NETFLIX.COM", digitos = "0042")
        val inicial = detector.detectar(listOf(primera, segunda))
        val actualizada = detector.detectar(listOf(segunda, primera, primera.copy(id = 3, fecha = LocalDate.parse("2026-02-01"))))
        assertEquals(2, inicial.size)
        assertEquals(inicial.associate { it.ultimosDigitos to it.id }, actualizada.associate { it.ultimosDigitos to it.id })
        assertEquals(2, actualizada.first { it.ultimosDigitos == "0012" }.cantidadMovimientos)
    }

    @Test
    fun `omite el mismo servicio ya confirmado sin bloquear otra tarjeta`() {
        val confirmada = Suscripcion(
            1, "Video", "SPOTIFY.COM", BigDecimal("100.00"), "Suscripciones", FrecuenciaSuscripcion.MENSUAL,
            null, null, "Banco ficticio", TipoTarjeta.CREDITO, "0012", EstadoSuscripcion.ACTIVA,
            OrigenSuscripcion.AUTOMATICA, "", ""
        )
        val movimientos = listOf(movimiento(1, "PAYPAL * SPOTIFY"), movimiento(2, "Spotify", digitos = "0042"))
        val sugerencia = detector.detectar(movimientos, confirmadas = listOf(confirmada)).single()
        assertEquals("0042", sugerencia.ultimosDigitos)
        val manualSinTarjeta = confirmada.copy(origen = OrigenSuscripcion.MANUAL, ultimosDigitos = null)
        assertTrue(detector.detectar(movimientos, confirmadas = listOf(manualSinTarjeta)).isEmpty())
    }

    @Test
    fun `respeta un descarte aun con nuevos movimientos y no duplica variantes`() {
        val original = movimiento(1, "DISNEY+")
        val nuevo = movimiento(2, "PayPal Disneyplus", "2026-02-01")
        val id = detector.detectar(listOf(original)).single().id
        assertEquals(id, detector.detectar(listOf(original, nuevo)).single().id)
        assertTrue(detector.detectar(listOf(original, nuevo), descartadas = setOf(id)).isEmpty())
    }

    private fun movimiento(
        id: Int,
        comercio: String = "Proveedor ficticio",
        fecha: String = "2026-01-01",
        monto: String = "100.00",
        categoria: String = "Servicios",
        digitos: String = "0012"
    ) = MovimientoDeteccion(id, comercio, BigDecimal(monto), categoria, LocalDate.parse(fecha),
        "Banco ficticio", TipoTarjeta.CREDITO, digitos)
}
