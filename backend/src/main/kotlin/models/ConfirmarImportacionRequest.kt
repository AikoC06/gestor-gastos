package com.gestorgastos.models

import kotlinx.serialization.Serializable

@Serializable
data class ConfirmarImportacionRequest(
    val movimientos: List<MovimientoExtraido>,
    val permitirCoincidencias: Boolean = false
)