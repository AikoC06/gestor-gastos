package com.gestorgastos.models

import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.serialization.BigDecimalSerializer
import kotlinx.serialization.Serializable
import java.math.BigDecimal

@Serializable
data class MovimientoExtraido(
    val comercio: String,
    @Serializable(with = BigDecimalSerializer::class)
    val monto: BigDecimal,
    val fechaCargo: String,
    val categoria: String,
    val banco: String,
    val tipoTarjeta: TipoTarjeta,
    val ultimosDigitos: String?
)