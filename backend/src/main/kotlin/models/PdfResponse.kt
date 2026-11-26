package com.gestorgastos.models

import com.gestorgastos.serialization.BigDecimalSerializer
import kotlinx.serialization.Serializable
import java.math.BigDecimal

@Serializable
data class PdfResponse(
    val nombreArchivo: String,
    val texto: String,
    val movimientos: List<MovimientoExtraido>,
    val totalMovimientos: Int,
    @Serializable(with = BigDecimalSerializer::class)
    val montoTotal: BigDecimal
)