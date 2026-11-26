package com.gestorgastos.services

import com.gestorgastos.enums.EstadoSuscripcion
import com.gestorgastos.enums.FrecuenciaSuscripcion
import com.gestorgastos.models.*
import com.gestorgastos.repositories.SuscripcionRepository
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.ZoneId

class SuscripcionService(private val repository: SuscripcionRepository = SuscripcionRepository()) {
    suspend fun listar() = repository.listar()
    suspend fun obtener(id: Int) = repository.obtener(id)
    suspend fun crear(datos: GuardarSuscripcionRequest) = repository.crear(datos)
    suspend fun actualizar(id: Int, datos: GuardarSuscripcionRequest) = repository.actualizar(id, datos)
    suspend fun eliminar(id: Int) = repository.eliminar(id)

    suspend fun resumen() = calcularResumen(
        repository.listar(EstadoSuscripcion.ACTIVA),
        LocalDate.now(ZoneId.of("America/Mexico_City"))
    )

    fun validar(datos: GuardarSuscripcionRequest): List<String> {
        val inicio = datos.fechaInicio?.let(::fechaValida)
        val siguiente = datos.proximoCobro?.let(::fechaValida)
        return listOfNotNull(
            "El nombre es inválido".takeIf { datos.nombre.isBlank() || datos.nombre.length > 255 },
            "El comercio es inválido".takeIf { datos.comercio.isBlank() || datos.comercio.length > 255 },
            "El monto es inválido".takeUnless { datos.monto.esMontoValido() },
            "La categoría es inválida".takeIf { datos.categoria.isBlank() || datos.categoria.length > 100 },
            "La fecha de inicio es inválida".takeIf { datos.fechaInicio != null && inicio == null },
            "La fecha de próximo cobro es inválida".takeIf { datos.proximoCobro != null && siguiente == null },
            "El próximo cobro debe ser igual o posterior a la fecha de inicio".takeIf {
                inicio != null && siguiente != null && siguiente < inicio
            },
            "El banco es inválido".takeIf { (datos.banco?.length ?: 0) > 100 },
            "Los últimos dígitos son inválidos".takeIf { datos.ultimosDigitos?.matches(cuatroDigitos) == false }
        )
    }
}

private val cuatroDigitos = Regex("""[0-9]{4}""")

private fun fechaValida(valor: String): LocalDate? =
    runCatching { LocalDate.parse(valor) }.getOrNull()?.takeIf { it.year in 1..9999 }

private fun FrecuenciaSuscripcion.cobrosAnuales(): BigDecimal = when (this) {
    FrecuenciaSuscripcion.SEMANAL -> 52
    FrecuenciaSuscripcion.QUINCENAL -> 24
    FrecuenciaSuscripcion.MENSUAL -> 12
    FrecuenciaSuscripcion.BIMESTRAL -> 6
    FrecuenciaSuscripcion.TRIMESTRAL -> 4
    FrecuenciaSuscripcion.SEMESTRAL -> 2
    FrecuenciaSuscripcion.ANUAL -> 1
}.toBigDecimal()

internal fun calcularResumen(suscripciones: List<Suscripcion>, hoy: LocalDate): ResumenSuscripciones {
    val activas = suscripciones.filter { it.estado == EstadoSuscripcion.ACTIVA }
    val anual = activas.map { it.monto * it.frecuencia.cobrosAnuales() }
        .fold(BigDecimal.ZERO, BigDecimal::add)
    val proximos = activas.mapNotNull { suscripcion ->
        val fecha = suscripcion.proximoCobro?.let(LocalDate::parse)
        fecha?.takeUnless { it < hoy }?.let {
            CobroSuscripcion(suscripcion.id, suscripcion.nombre, it.toString(), suscripcion.monto)
        }
    }.sortedWith(compareBy(CobroSuscripcion::fecha, CobroSuscripcion::suscripcionId))

    return ResumenSuscripciones(
        activas = activas.size,
        costoMensual = anual.divide(12.toBigDecimal(), 2, RoundingMode.HALF_UP),
        costoAnual = anual.setScale(2, RoundingMode.HALF_UP),
        proximosCobros = proximos
    )
}
