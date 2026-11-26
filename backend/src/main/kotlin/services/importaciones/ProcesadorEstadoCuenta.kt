package com.gestorgastos.services.importaciones

import com.gestorgastos.models.MovimientoExtraido
import com.gestorgastos.services.importaciones.extractores.ExtractorPrueba
import com.gestorgastos.services.importaciones.extractores.ExtractorNu

class ProcesadorEstadoCuenta {

    private val extractores = listOf(
        ExtractorNu(),
        ExtractorPrueba()
    )

    fun procesar(texto: String): List<MovimientoExtraido> {

        val extractor = extractores.firstOrNull {
            it.soporta(texto)
        } ?: throw IllegalArgumentException(
            "Formato de estado de cuenta no reconocido"
        )

        return extractor.extraer(texto)
    }
}