package com.gestorgastos.models

import com.gestorgastos.enums.OrigenMovimiento
import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.serialization.BigDecimalSerializer
import kotlinx.serialization.Serializable
import java.math.BigDecimal
import java.time.LocalDate

internal enum class OrdenGastos { FECHA, MONTO, COMERCIO }

internal data class ConsultaGastos(
    val comercio: String?,
    val fechaDesde: LocalDate?,
    val fechaHasta: LocalDate?,
    val categoria: String?,
    val banco: String?,
    val tipoTarjeta: TipoTarjeta?,
    val ultimosDigitos: String?,
    val origen: OrigenMovimiento?,
    val montoMinimo: BigDecimal?,
    val montoMaximo: BigDecimal?,
    val ordenarPor: OrdenGastos,
    val ascendente: Boolean,
    val pagina: Int,
    val tamanoPagina: Int
)

@Serializable
internal data class PaginaGastos(
    val movimientos: List<Gasto>,
    val totalRegistros: Long,
    @Serializable(with = BigDecimalSerializer::class)
    val montoTotal: BigDecimal
)

@Serializable
internal data class EliminarGastosRequest(val ids: List<Int>)
