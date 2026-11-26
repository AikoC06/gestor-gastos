package com.gestorgastos.enums

import kotlinx.serialization.Serializable

@Serializable
enum class TipoTarjeta {
    CREDITO,
    DEBITO,
    DESCONOCIDO
}