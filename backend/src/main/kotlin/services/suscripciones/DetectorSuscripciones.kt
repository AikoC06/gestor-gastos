package com.gestorgastos.services.suscripciones

import com.gestorgastos.enums.FrecuenciaSuscripcion
import com.gestorgastos.enums.OrigenSuscripcion
import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.models.*
import java.math.BigDecimal
import java.security.MessageDigest
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.abs

internal data class MovimientoDeteccion(
    val id: Int, val comercio: String, val monto: BigDecimal, val categoria: String,
    val fecha: LocalDate, val banco: String?, val tipoTarjeta: TipoTarjeta, val ultimosDigitos: String?
)

private data class Grupo(val comercio: String, val banco: String, val tipo: TipoTarjeta, val digitos: String) {
    fun identificador(): String = MessageDigest.getInstance("SHA-256")
        .digest(listOf(comercio, banco, tipo.name, digitos).joinToString("\u0000").toByteArray())
        .joinToString("") { "%02x".format(it) }

    fun coincide(suscripcion: Suscripcion): Boolean {
        val otroBanco = normalizarComercio(suscripcion.banco.orEmpty())
        val otrosDigitos = suscripcion.ultimosDigitos.orEmpty()
        val manual = suscripcion.origen == OrigenSuscripcion.MANUAL
        return comercio == claveComercio(suscripcion.comercio) &&
            (banco == otroBanco || manual && otroBanco.isEmpty()) &&
            (tipo == suscripcion.tipoTarjeta || manual && suscripcion.tipoTarjeta == TipoTarjeta.DESCONOCIDO) &&
            (digitos == otrosDigitos || manual && otrosDigitos.isEmpty())
    }
}

private val excluidos = Regex(
    """\b(?:msi|meses sin intereses|meses con intereses|compra a (?:\d+ )?meses|(?:parcialidad|cuota|mensualidad) \d+ de \d+|pago (?:de |a )?(?:la )?tarjeta|abono (?:a |de )?(?:la )?tarjeta|pago recibido|su pago gracias|pago tdc|pago de credito)\b"""
)
private val fraccionParcialidad = Regex("""\b\d{1,2}\s*/\s*\d{1,2}\b""")
private val categoriaSuscripciones = "suscripciones"
private val toleranciaBase = BigDecimal("0.10")
private val aumentoMaximo = BigDecimal("0.25")

private data class Periodo(val frecuencia: FrecuenciaSuscripcion, val dias: Long, val meses: Long, val margen: Long, val minimo: Int = 3) {
    fun siguiente(fecha: LocalDate): LocalDate = fecha.plusMonths(meses).plusDays(dias)
    fun coincide(anterior: LocalDate, posterior: LocalDate): Boolean =
        abs(ChronoUnit.DAYS.between(siguiente(anterior), posterior)) <= margen
}

private val periodos = listOf(
    Periodo(FrecuenciaSuscripcion.SEMANAL, 7, 0, 1),
    Periodo(FrecuenciaSuscripcion.QUINCENAL, 15, 0, 2),
    Periodo(FrecuenciaSuscripcion.MENSUAL, 0, 1, 4),
    Periodo(FrecuenciaSuscripcion.BIMESTRAL, 0, 2, 5),
    Periodo(FrecuenciaSuscripcion.TRIMESTRAL, 0, 3, 7),
    Periodo(FrecuenciaSuscripcion.SEMESTRAL, 0, 6, 9),
    Periodo(FrecuenciaSuscripcion.ANUAL, 0, 12, 14, minimo = 2)
)

private data class Recurrencia(val periodo: Periodo, val movimientos: List<MovimientoDeteccion>) {
    fun proximoCobro(): LocalDate {
        val siguiente = periodo.siguiente(movimientos.last().fecha)
        val cobraAlCierre = periodo.meses > 0 && movimientos.takeLast(2).all { it.fecha.dayOfMonth == it.fecha.lengthOfMonth() }
        return if (cobraAlCierre) siguiente.withDayOfMonth(siguiente.lengthOfMonth()) else siguiente
    }
}

private fun montosSimilares(a: BigDecimal, b: BigDecimal): Boolean =
    (b - a).abs() <= (a.min(b) * toleranciaBase).max(BigDecimal("0.50"))

private fun aumentoRazonable(a: BigDecimal, b: BigDecimal): Boolean =
    b > a && b - a <= a * aumentoMaximo

private fun analizarRecurrencia(movimientos: List<MovimientoDeteccion>): Recurrencia? =
    periodos.mapNotNull { periodo ->
        val pares = movimientos.zipWithNext()
        val tramos = pares.asReversed().takeWhile { (a, b) ->
            periodo.coincide(a.fecha, b.fecha) && (montosSimilares(a.monto, b.monto) || aumentoRazonable(a.monto, b.monto))
        }
        val movimientosTramo = movimientos.takeLast(tramos.size + 1)
        val aumentos = tramos.count { (a, b) -> !montosSimilares(a.monto, b.monto) }
        val variacionAdmitida = aumentos == 0 || aumentos == 1 && movimientosTramo.size >= 3
        if (movimientosTramo.size >= periodo.minimo && variacionAdmitida) Recurrencia(periodo, movimientosTramo) else null
    }.maxByOrNull { it.movimientos.size }

class DetectorSuscripciones {
    internal fun detectar(
        movimientos: List<MovimientoDeteccion>,
        confirmadas: List<Suscripcion> = emptyList(),
        descartadas: Set<String> = emptySet()
    ): List<SugerenciaSuscripcion> =
        movimientos.asSequence()
            .filter { it.monto.esMontoValido() && !excluidos.containsMatchIn(normalizarComercio(it.comercio)) &&
                !fraccionParcialidad.containsMatchIn(it.comercio) }
            .groupBy { Grupo(claveComercio(it.comercio), normalizarComercio(it.banco.orEmpty()), it.tipoTarjeta, it.ultimosDigitos.orEmpty()) }
            .mapNotNull { (grupo, historial) ->
                val id = grupo.identificador()
                if (grupo.comercio.isBlank() || id in descartadas || confirmadas.any(grupo::coincide)) null
                else sugerir(grupo.comercio, id, historial)
            }.sortedWith(compareBy<SugerenciaSuscripcion> { it.confianza }.thenByDescending { it.ultimoCobro }.thenBy { it.id })

    private fun sugerir(comercio: String, id: String, historial: List<MovimientoDeteccion>): SugerenciaSuscripcion? {
        val servicio = CatalogoServicios.buscar(comercio)
        val ordenados = historial.sortedWith(compareBy(MovimientoDeteccion::fecha, MovimientoDeteccion::id))
        val porCategoria = ordenados.filter { normalizarComercio(it.categoria) == categoriaSuscripciones }
        val recurrencia = analizarRecurrencia(ordenados.distinctBy { it.fecha })
        val evidencia = recurrencia?.movimientos ?: (if (servicio != null) ordenados else porCategoria)
        val ultimo = evidencia.lastOrNull() ?: return null
        return SugerenciaSuscripcion(
            id, servicio?.nombre ?: ultimo.comercio.trim(), comercio, ultimo.monto,
            recurrencia?.periodo?.frecuencia, ultimo.fecha.toString(),
            recurrencia?.proximoCobro()?.toString(),
            ultimo.banco, ultimo.tipoTarjeta, ultimo.ultimosDigitos,
            evidencia.map { it.id }, evidencia.size,
            when {
                recurrencia != null && (servicio != null || recurrencia.movimientos.size >= 3) -> ConfianzaSuscripcion.ALTA
                recurrencia != null || servicio != null -> ConfianzaSuscripcion.MEDIA
                else -> ConfianzaSuscripcion.BAJA
            },
            listOfNotNull(
                servicio?.let { "Servicio de suscripción conocido." },
                "Hay cargos en la categoría Suscripciones.".takeIf { porCategoria.isNotEmpty() },
                recurrencia?.let { "${it.movimientos.size} cargos con intervalos compatibles y montos similares." },
                "Sin historial suficiente para estimar la frecuencia.".takeIf { recurrencia == null }
            ),
            evidencia.map { MovimientoSugerido(it.id, it.comercio, it.fecha.toString(), it.monto) }
        )
    }
}
