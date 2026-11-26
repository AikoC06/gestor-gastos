package com.gestorgastos.models

import java.math.BigDecimal

private val MONTO_MAXIMO = BigDecimal("9999999999.99")

internal fun BigDecimal.esMontoValido(): Boolean =
    signum() > 0 && scale() <= 2 && this <= MONTO_MAXIMO
