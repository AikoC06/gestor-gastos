package com.gestorgastos.services.importaciones.extractores

import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.models.MovimientoExtraido
import com.gestorgastos.services.ClasificadorGastos
import com.gestorgastos.services.importaciones.ExtractorEstadoCuenta
import com.gestorgastos.services.importaciones.aMontoExtraido
import com.gestorgastos.services.importaciones.validarMontoExtraido
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.ResolverStyle

class ExtractorPrueba : ExtractorEstadoCuenta {

    private val patron = Regex(
        """^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+\$?([\d,]+\.\d{2})$"""
    )

    private val formatoFecha =
        DateTimeFormatter.ofPattern("dd/MM/uuuu")
            .withResolverStyle(ResolverStyle.STRICT)

    override fun soporta(texto: String): Boolean =
        texto.contains(
            "BANCO DE PRUEBA",
            ignoreCase = true
        )

    override fun extraer(
        texto: String
    ): List<MovimientoExtraido> {

        val ultimosDigitos =
            Regex("""\*{4}\s*(\d{4})""")
                .find(texto)
                ?.groupValues
                ?.get(1)

        return texto.lineSequence()
            .map { it.trim() }
            .mapNotNull { patron.matchEntire(it) }
            .map { coincidencia ->

                val (fecha, comercio, monto) =
                    coincidencia.destructured

                MovimientoExtraido(
                    comercio = comercio,
                    monto = validarMontoExtraido(monto.aMontoExtraido()),
                    fechaCargo = LocalDate
                        .parse(fecha, formatoFecha)
                        .toString(),
                    categoria = ClasificadorGastos
                        .clasificar(comercio),
                    banco = "Banco de prueba",
                    tipoTarjeta = TipoTarjeta.CREDITO,
                    ultimosDigitos = ultimosDigitos
                )
            }
            .toList()
    }
}