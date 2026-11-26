package com.gestorgastos.services.importaciones.extractores

import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.models.MovimientoExtraido
import com.gestorgastos.services.ClasificadorGastos
import com.gestorgastos.services.importaciones.ExtractorEstadoCuenta
import com.gestorgastos.services.importaciones.aMontoExtraido
import com.gestorgastos.services.importaciones.validarMontoExtraido
import java.time.LocalDate

class ExtractorNu : ExtractorEstadoCuenta {

    private val meses = mapOf(
        "ENE" to 1,
        "FEB" to 2,
        "MAR" to 3,
        "ABR" to 4,
        "MAY" to 5,
        "JUN" to 6,
        "JUL" to 7,
        "AGO" to 8,
        "SEP" to 9,
        "OCT" to 10,
        "NOV" to 11,
        "DIC" to 12
    )

    private val encabezado =
        "CARGOS, ABONOS Y COMPRAS REGULARES (NO A MESES)"

    private val patronMovimiento = Regex(
        """^(\d{2} [A-Z]{3} \d{4})\s+(\d{2} [A-Z]{3} \d{4})\s+(.+?)\s+([+-])\s*\$\s*([\d,]+\.\d{2})$"""
    )

    private val patronTarjeta = Regex(
        """^Tarjeta\s+(?:virtual|física)\s+\*{4}\s*(\d{4})""",
        RegexOption.IGNORE_CASE
    )

    override fun soporta(texto: String): Boolean {
        return texto.contains(
            "Tarjeta de Crédito Nu",
            ignoreCase = true
        ) && texto.contains(
            encabezado,
            ignoreCase = true
        )
    }

    override fun extraer(
        texto: String
    ): List<MovimientoExtraido> {

        val lineas = texto.lineSequence()
            .map { it.trim().replace(Regex("""\s+"""), " ") }
            .filter { it.isNotBlank() }
            .toList()

        val movimientos = lineas
            .dropWhile {
                !it.equals(encabezado, ignoreCase = true)
            }
            .takeWhile {
                !it.startsWith("Total de cargos", ignoreCase = true)
            }

        return movimientos.mapIndexedNotNull { index, linea ->

            val coincidencia = patronMovimiento
                .matchEntire(linea)
                ?: return@mapIndexedNotNull null

            val (
                _,
                fechaCargo,
                descripcion,
                signo,
                importe
            ) = coincidencia.destructured

            // Ignorar pagos, descuentos y devoluciones.
            if (signo != "+") {
                return@mapIndexedNotNull null
            }

            val comercio = descripcion
                .substringBefore("| RFC:")
                .trim()

            val monto = importe.aMontoExtraido()

            if (monto.signum() == 0) {
                return@mapIndexedNotNull null
            }

            val siguienteLinea = movimientos
                .getOrNull(index + 1)
                .orEmpty()

            val ultimosDigitos = patronTarjeta
                .find(siguienteLinea)
                ?.groupValues
                ?.get(1)

            MovimientoExtraido(
                comercio = comercio,
                monto = validarMontoExtraido(monto),
                fechaCargo = convertirFecha(fechaCargo),
                categoria = ClasificadorGastos.clasificar(comercio),
                banco = "Nu",
                tipoTarjeta = TipoTarjeta.CREDITO,
                ultimosDigitos = ultimosDigitos
            )
        }
    }

    private fun convertirFecha(fecha: String): String {

        val (dia, mes, anio) = fecha.split(" ")

        return LocalDate.of(
            anio.toInt(),
            meses.getValue(mes),
            dia.toInt()
        ).toString()
    }
}