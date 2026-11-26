package com.gestorgastos.services

object ClasificadorGastos {

    private val categorias = mapOf(
        "Suscripciones" to listOf(
            "NETFLIX", "SPOTIFY", "DISNEY", "HBO"
        ),
        "Alimentación" to listOf(
            "STARBUCKS", "OXXO", "RESTAURANTE"
        ),
        "Transporte" to listOf(
            "UBER", "DIDI", "GASOLINA"
        ),
        "Compras" to listOf(
            "AMAZON", "MERCADO LIBRE", "ALIEXPRESS"
        ),
        "Supermercado" to listOf(
            "WALMART", "SORIANA", "CHEDRAUI"
        )
    )

    fun clasificar(comercio: String): String =
        categorias.entries.firstOrNull { (_, palabras) ->
            palabras.any { palabra ->
                comercio.contains(
                    palabra,
                    ignoreCase = true
                )
            }
        }?.key ?: "Sin clasificar"
}