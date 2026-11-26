package com.gestorgastos.services.suscripciones

import java.text.Normalizer
import java.util.Locale

private val marcasDiacriticas = Regex("""\p{M}+""")
private val separadores = Regex("""[^a-z0-9]+""")
private val intermediario = Regex("""^(?:paypal|mercado pago|mercadopago|stripe) """)

internal fun normalizarComercio(comercio: String): String =
    Normalizer.normalize(comercio.substringBefore("| RFC:", comercio), Normalizer.Form.NFD)
        .replace(marcasDiacriticas, "")
        .lowercase(Locale.ROOT)
        .replace("+", " plus ")
        .replace(separadores, " ")
        .trim()
        .replace(intermediario, "")
        .trim()

internal data class ServicioConocido(val clave: String, val nombre: String, val variantes: List<String>)

internal object CatalogoServicios {
    private val servicios = listOf(
        ServicioConocido("netflix", "Netflix", listOf("netflix")),
        ServicioConocido("spotify", "Spotify", listOf("spotify")),
        ServicioConocido("disney plus", "Disney+", listOf("disney plus", "disneyplus")),
        ServicioConocido("google one", "Google One", listOf("google one", "googleone", "google storage")),
        ServicioConocido("icloud", "iCloud", listOf("icloud", "icloudplus")),
        ServicioConocido("microsoft 365", "Microsoft 365", listOf("microsoft 365", "msft 365", "office 365")),
        ServicioConocido("youtube premium", "YouTube Premium", listOf("youtube premium", "youtubepremium")),
        ServicioConocido("chatgpt", "ChatGPT", listOf("chatgpt", "openai chatgpt", "chat gpt")),
        ServicioConocido("github copilot", "GitHub Copilot", listOf("github copilot", "githubcopilot")),
        ServicioConocido("amazon prime", "Amazon Prime", listOf("amazon prime", "amzn prime", "prime video", "amazonprime")),
        ServicioConocido("max", "Max", listOf("hbo max", "hbomax", "max com")),
        ServicioConocido("apple music", "Apple Music", listOf("apple music")),
        ServicioConocido("adobe creative cloud", "Adobe Creative Cloud", listOf("adobe creative cloud"))
    )

    fun buscar(comercioNormalizado: String): ServicioConocido? {
        val tokens = " $comercioNormalizado "
        return servicios.firstOrNull { servicio -> servicio.clave == comercioNormalizado || servicio.variantes.any { " $it " in tokens } }
    }
}

internal fun claveComercio(comercio: String): String =
    normalizarComercio(comercio).let { CatalogoServicios.buscar(it)?.clave ?: it }
