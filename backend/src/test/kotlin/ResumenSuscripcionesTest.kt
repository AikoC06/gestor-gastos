package com.gestorgastos

import com.gestorgastos.enums.EstadoSuscripcion
import com.gestorgastos.enums.FrecuenciaSuscripcion
import com.gestorgastos.enums.OrigenSuscripcion
import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.models.Suscripcion
import com.gestorgastos.services.calcularResumen
import java.math.BigDecimal
import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class ResumenSuscripcionesTest {
    private val hoy = LocalDate.of(2026, 11, 25)

    @Test
    fun `calcula los costos equivalentes para las siete frecuencias`() {
        val casos = listOf(
            Triple(FrecuenciaSuscripcion.SEMANAL, "5200.00", "62400.00"),
            Triple(FrecuenciaSuscripcion.QUINCENAL, "2400.00", "28800.00"),
            Triple(FrecuenciaSuscripcion.MENSUAL, "1200.00", "14400.00"),
            Triple(FrecuenciaSuscripcion.BIMESTRAL, "600.00", "7200.00"),
            Triple(FrecuenciaSuscripcion.TRIMESTRAL, "400.00", "4800.00"),
            Triple(FrecuenciaSuscripcion.SEMESTRAL, "200.00", "2400.00"),
            Triple(FrecuenciaSuscripcion.ANUAL, "100.00", "1200.00")
        )
        casos.forEach { (frecuencia, mensual, anual) ->
            val resultado = calcularResumen(listOf(suscripcion(1, frecuencia)), hoy)
            assertEquals(BigDecimal(mensual), resultado.costoMensual, frecuencia.name)
            assertEquals(BigDecimal(anual), resultado.costoAnual, frecuencia.name)
        }
    }

    @Test
    fun `suma con precision y redondea el total mensual una sola vez`() {
        val activas = (1..3).map { suscripcion(it, FrecuenciaSuscripcion.SEMANAL, monto = "0.01") }
        val inactivas = listOf(
            suscripcion(4, estado = EstadoSuscripcion.PAUSADA),
            suscripcion(5, estado = EstadoSuscripcion.CANCELADA)
        )
        val resultado = calcularResumen(activas + inactivas, hoy)
        assertEquals(3, resultado.activas)
        assertEquals(BigDecimal("0.13"), resultado.costoMensual)
        assertEquals(BigDecimal("1.56"), resultado.costoAnual)
    }

    @Test
    fun `solo presenta cobros conocidos vigentes ordenados por fecha`() {
        val resultado = calcularResumen(
            listOf(
                suscripcion(1, cobro = "2026-12-01"),
                suscripcion(2, cobro = "2026-11-25"),
                suscripcion(3, cobro = "2026-11-24"),
                suscripcion(4),
                suscripcion(5, estado = EstadoSuscripcion.PAUSADA, cobro = "2026-11-26"),
                suscripcion(6, estado = EstadoSuscripcion.CANCELADA, cobro = "2026-11-27")
            ),
            hoy
        )
        assertEquals(listOf(2, 1), resultado.proximosCobros.map { it.suscripcionId })
        assertEquals(BigDecimal("1200.00"), resultado.proximosCobros.first().monto)
    }

    @Test
    fun `el resumen vacio conserva dos decimales`() {
        val resultado = calcularResumen(emptyList(), hoy)
        assertEquals(0, resultado.activas)
        assertEquals(BigDecimal("0.00"), resultado.costoMensual)
        assertEquals(BigDecimal("0.00"), resultado.costoAnual)
        assertEquals(emptyList(), resultado.proximosCobros)
    }

    private fun suscripcion(
        id: Int,
        frecuencia: FrecuenciaSuscripcion = FrecuenciaSuscripcion.MENSUAL,
        estado: EstadoSuscripcion = EstadoSuscripcion.ACTIVA,
        monto: String = "1200.00",
        cobro: String? = null
    ) = Suscripcion(
        id = id,
        nombre = "Suscripción ficticia $id",
        comercio = "Comercio ficticio",
        monto = BigDecimal(monto),
        categoria = "Servicios",
        frecuencia = frecuencia,
        fechaInicio = null,
        proximoCobro = cobro,
        banco = null,
        tipoTarjeta = TipoTarjeta.DESCONOCIDO,
        ultimosDigitos = null,
        estado = estado,
        origen = OrigenSuscripcion.MANUAL,
        createdAt = "2026-11-25T00:00:00Z",
        updatedAt = "2026-11-25T00:00:00Z"
    )
}
