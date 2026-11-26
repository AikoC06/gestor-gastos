package com.gestorgastos.repositories

import com.gestorgastos.enums.EstadoSuscripcion
import com.gestorgastos.enums.OrigenSuscripcion
import com.gestorgastos.models.*
import com.gestorgastos.services.SuscripcionService
import com.gestorgastos.services.suscripciones.DetectorSuscripciones
import com.gestorgastos.services.suscripciones.MovimientoDeteccion
import com.gestorgastos.tables.DecisionesSuscripcionTable
import com.gestorgastos.tables.GastosTable
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import java.sql.Connection

internal class SugerenciaNoDisponible : IllegalStateException()
internal class ConfirmacionInvalida(val errores: List<String>) : IllegalArgumentException()

internal class SugerenciaSuscripcionRepository {
    private val suscripciones = SuscripcionRepository()
    private val servicio = SuscripcionService(suscripciones)
    private val detector = DetectorSuscripciones()

    suspend fun consultar(): List<SugerenciaSuscripcion> =
        newSuspendedTransaction(Dispatchers.IO, transactionIsolation = Connection.TRANSACTION_REPEATABLE_READ) {
            detectar()
        }

    suspend fun confirmar(id: String, datos: ConfirmarSugerenciaRequest): Suscripcion =
        newSuspendedTransaction(Dispatchers.IO) {
            bloquearEscrituras()
            val deteccion = detectar().firstOrNull { it.id == id } ?: throw SugerenciaNoDisponible()
            if (datos.movimientosIds != deteccion.movimientosIds) throw SugerenciaNoDisponible()

            val registro = GuardarSuscripcionRequest(
                nombre = datos.nombre,
                comercio = deteccion.movimientos.last().comercio,
                monto = datos.monto,
                categoria = "Suscripciones",
                frecuencia = datos.frecuencia,
                fechaInicio = deteccion.movimientos.first().fechaCargo,
                proximoCobro = datos.proximoCobro,
                banco = deteccion.banco,
                tipoTarjeta = deteccion.tipoTarjeta,
                ultimosDigitos = deteccion.ultimosDigitos,
                estado = EstadoSuscripcion.ACTIVA
            )
            val errores = servicio.validar(registro)
            if (errores.isNotEmpty()) throw ConfirmacionInvalida(errores)
            val suscripcion = suscripciones.crearEnTransaccion(registro, OrigenSuscripcion.AUTOMATICA)
            val asociados = deteccion.movimientosIds.chunked(1000).sumOf { ids ->
                GastosTable.update({ (GastosTable.id inList ids) and GastosTable.suscripcionId.isNull() }) {
                    it[suscripcionId] = suscripcion.id
                }
            }
            if (asociados != deteccion.cantidadMovimientos) throw SugerenciaNoDisponible()
            DecisionesSuscripcionTable.insert {
                it[DecisionesSuscripcionTable.id] = id
                it[suscripcionId] = suscripcion.id
            }
            suscripcion
        }

    suspend fun descartar(id: String) = newSuspendedTransaction(Dispatchers.IO) {
        bloquearEscrituras()
        if (detectar().none { it.id == id }) throw SugerenciaNoDisponible()
        DecisionesSuscripcionTable.insert {
            it[DecisionesSuscripcionTable.id] = id
            it[suscripcionId] = null
        }
        Unit
    }

    private fun Transaction.bloquearEscrituras() {
        // Serializa la revisión con altas manuales y cambios a los cargos que sirven de evidencia.
        exec("LOCK TABLE suscripciones, gastos IN SHARE ROW EXCLUSIVE MODE")
    }

    private fun detectar(): List<SugerenciaSuscripcion> {
        val decisiones = DecisionesSuscripcionTable.select(DecisionesSuscripcionTable.id)
            .map { it[DecisionesSuscripcionTable.id] }.toSet()
        val confirmadas = suscripciones.listarEnTransaccion()
        val movimientos = with(GastosTable) {
            select(id, comercio, monto, categoria, fechaCargo, banco, tipoTarjeta, ultimosDigitos)
                .where { suscripcionId.isNull() }
                .map { MovimientoDeteccion(it[id], it[comercio], it[monto], it[categoria], it[fechaCargo],
                    it[banco], it[tipoTarjeta], it[ultimosDigitos]) }
        }
        return detector.detectar(movimientos, confirmadas, decisiones)
    }
}
