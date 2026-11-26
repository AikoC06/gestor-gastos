package com.gestorgastos.models

import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.serialization.BigDecimalSerializer
import kotlinx.serialization.Serializable
import java.math.BigDecimal

@Serializable
data class CrearGastoRequest(
    val comercio: String,
    @Serializable(with = BigDecimalSerializer::class)
    val monto: BigDecimal,
    val categoria: String,
    val banco: String? = null,
    val fechaCargo: String,
    val tipoTarjeta: TipoTarjeta = TipoTarjeta.DESCONOCIDO,
    val ultimosDigitos: String? = null
)