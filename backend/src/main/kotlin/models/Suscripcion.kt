package com.gestorgastos.models

import com.gestorgastos.enums.EstadoSuscripcion
import com.gestorgastos.enums.FrecuenciaSuscripcion
import com.gestorgastos.enums.OrigenSuscripcion
import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.serialization.BigDecimalSerializer
import kotlinx.serialization.Serializable
import java.math.BigDecimal

@Serializable
data class Suscripcion(
    val id: Int,
    val nombre: String,
    val comercio: String,
    @Serializable(with = BigDecimalSerializer::class)
    val monto: BigDecimal,
    val categoria: String,
    val frecuencia: FrecuenciaSuscripcion,
    val fechaInicio: String?,
    val proximoCobro: String?,
    val banco: String?,
    val tipoTarjeta: TipoTarjeta,
    val ultimosDigitos: String?,
    val estado: EstadoSuscripcion,
    val origen: OrigenSuscripcion,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class GuardarSuscripcionRequest(
    val nombre: String,
    val comercio: String,
    @Serializable(with = BigDecimalSerializer::class)
    val monto: BigDecimal,
    val categoria: String,
    val frecuencia: FrecuenciaSuscripcion,
    val fechaInicio: String? = null,
    val proximoCobro: String? = null,
    val banco: String? = null,
    val tipoTarjeta: TipoTarjeta = TipoTarjeta.DESCONOCIDO,
    val ultimosDigitos: String? = null,
    val estado: EstadoSuscripcion = EstadoSuscripcion.ACTIVA
)

@Serializable
data class ResumenSuscripciones(
    val activas: Int,
    @Serializable(with = BigDecimalSerializer::class)
    val costoMensual: BigDecimal,
    @Serializable(with = BigDecimalSerializer::class)
    val costoAnual: BigDecimal,
    val proximosCobros: List<CobroSuscripcion>
)

@Serializable
data class CobroSuscripcion(
    val suscripcionId: Int,
    val nombre: String,
    val fecha: String,
    @Serializable(with = BigDecimalSerializer::class)
    val monto: BigDecimal
)
