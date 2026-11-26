package com.gestorgastos.models

import com.gestorgastos.serialization.BigDecimalSerializer
import kotlinx.serialization.Serializable
import java.math.BigDecimal

@Serializable
data class ImportacionResponse(
    val importados: Int,
    val posiblesDuplicados: List<MovimientoExtraido>,
    @Serializable(with = BigDecimalSerializer::class)
    val montoTotal: BigDecimal
)