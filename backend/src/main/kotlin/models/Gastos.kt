package com.gestorgastos.models

import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.enums.OrigenMovimiento
import com.gestorgastos.serialization.BigDecimalSerializer
import kotlinx.serialization.Serializable
import java.math.BigDecimal

@Serializable
data class Gasto(
    val id: Int,
    val comercio: String,
    @Serializable(with = BigDecimalSerializer::class)
    val monto: BigDecimal,
    val categoria: String,
    val banco: String?,
    val fechaCargo: String,
    val tipoTarjeta: TipoTarjeta,
    val ultimosDigitos: String?,
    val origen: OrigenMovimiento,
    val fechaRegistro: String
)