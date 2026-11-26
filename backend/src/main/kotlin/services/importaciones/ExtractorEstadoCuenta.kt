package com.gestorgastos.services.importaciones

import com.gestorgastos.models.MovimientoExtraido
import com.gestorgastos.models.esMontoValido
import java.math.BigDecimal

interface ExtractorEstadoCuenta {

    fun soporta(texto: String): Boolean

    fun extraer(texto: String): List<MovimientoExtraido>
}

internal fun String.aMontoExtraido(): BigDecimal = replace(",", "").toBigDecimal()

internal fun validarMontoExtraido(monto: BigDecimal): BigDecimal {
    require(monto.esMontoValido()) { "El monto extraído es inválido" }
    return monto
}
