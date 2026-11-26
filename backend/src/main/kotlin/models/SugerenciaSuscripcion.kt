package com.gestorgastos.models

import com.gestorgastos.enums.FrecuenciaSuscripcion
import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.serialization.BigDecimalSerializer
import kotlinx.serialization.Serializable
import java.math.BigDecimal

@Serializable
enum class ConfianzaSuscripcion { ALTA, MEDIA, BAJA }

@Serializable
data class MovimientoSugerido(
    val id: Int,
    val comercio: String,
    val fechaCargo: String,
    @Serializable(with = BigDecimalSerializer::class)
    val monto: BigDecimal
)

@Serializable
data class SugerenciaSuscripcion(
    val id: String,
    val nombre: String,
    val comercioNormalizado: String,
    @Serializable(with = BigDecimalSerializer::class)
    val montoEstimado: BigDecimal,
    val frecuenciaEstimada: FrecuenciaSuscripcion?,
    val ultimoCobro: String,
    val proximoCobroEstimado: String?,
    val banco: String?,
    val tipoTarjeta: TipoTarjeta,
    val ultimosDigitos: String?,
    val movimientosIds: List<Int>,
    val cantidadMovimientos: Int,
    val confianza: ConfianzaSuscripcion,
    val motivos: List<String>,
    val movimientos: List<MovimientoSugerido>
)

@Serializable
data class ConfirmarSugerenciaRequest(
    val nombre: String,
    @Serializable(with = BigDecimalSerializer::class)
    val monto: BigDecimal,
    val frecuencia: FrecuenciaSuscripcion,
    val proximoCobro: String? = null,
    val movimientosIds: List<Int>
)
