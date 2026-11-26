package com.gestorgastos.enums

import kotlinx.serialization.Serializable

@Serializable
enum class OrigenMovimiento {
    CORREO,
    CSV,
    MANUAL,
    PDF
}