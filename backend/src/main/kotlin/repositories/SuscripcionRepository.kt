package com.gestorgastos.repositories

import com.gestorgastos.enums.EstadoSuscripcion
import com.gestorgastos.models.GuardarSuscripcionRequest
import com.gestorgastos.models.Suscripcion
import com.gestorgastos.tables.SuscripcionesTable
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.statements.UpdateBuilder
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset

class SuscripcionRepository {

    suspend fun listar(estado: EstadoSuscripcion? = null): List<Suscripcion> =
        newSuspendedTransaction(Dispatchers.IO) {
            SuscripcionesTable.selectAll()
                .apply { if (estado != null) where { SuscripcionesTable.estado eq estado } }
                .orderBy(SuscripcionesTable.nombre to SortOrder.ASC, SuscripcionesTable.id to SortOrder.ASC)
                .map(::aSuscripcion)
        }

    suspend fun obtener(id: Int): Suscripcion? =
        newSuspendedTransaction(Dispatchers.IO) { buscar(id) }

    suspend fun crear(datos: GuardarSuscripcionRequest): Suscripcion =
        newSuspendedTransaction(Dispatchers.IO) {
            val ahora = LocalDateTime.now(ZoneOffset.UTC)
            val id = SuscripcionesTable.insert {
                it.asignar(datos, ahora)
                it[createdAt] = ahora
            } get SuscripcionesTable.id
            checkNotNull(buscar(id))
        }

    suspend fun actualizar(id: Int, datos: GuardarSuscripcionRequest): Suscripcion? =
        newSuspendedTransaction(Dispatchers.IO) {
            val actualizadas = SuscripcionesTable.update({ SuscripcionesTable.id eq id }) {
                it.asignar(datos, LocalDateTime.now(ZoneOffset.UTC))
            }
            if (actualizadas > 0) buscar(id) else null
        }

    suspend fun eliminar(id: Int): Boolean =
        newSuspendedTransaction(Dispatchers.IO) {
            SuscripcionesTable.deleteWhere { SuscripcionesTable.id eq id } > 0
        }

    private fun buscar(id: Int): Suscripcion? =
        SuscripcionesTable.selectAll().where { SuscripcionesTable.id eq id }.singleOrNull()?.let(::aSuscripcion)

    private fun UpdateBuilder<*>.asignar(datos: GuardarSuscripcionRequest, ahora: LocalDateTime) = with(SuscripcionesTable) {
        this@asignar[nombre] = datos.nombre.trim()
        this@asignar[comercio] = datos.comercio.trim()
        this@asignar[monto] = datos.monto
        this@asignar[categoria] = datos.categoria.trim()
        this@asignar[frecuencia] = datos.frecuencia
        this@asignar[fechaInicio] = datos.fechaInicio?.let(LocalDate::parse)
        this@asignar[proximoCobro] = datos.proximoCobro?.let(LocalDate::parse)
        this@asignar[banco] = datos.banco?.trim()?.takeIf(String::isNotEmpty)
        this@asignar[tipoTarjeta] = datos.tipoTarjeta
        this@asignar[ultimosDigitos] = datos.ultimosDigitos
        this@asignar[estado] = datos.estado
        this@asignar[updatedAt] = ahora
    }

    private fun aSuscripcion(row: ResultRow) = with(SuscripcionesTable) {
        Suscripcion(
            id = row[id],
            nombre = row[nombre],
            comercio = row[comercio],
            monto = row[monto],
            categoria = row[categoria],
            frecuencia = row[frecuencia],
            fechaInicio = row[fechaInicio]?.toString(),
            proximoCobro = row[proximoCobro]?.toString(),
            banco = row[banco],
            tipoTarjeta = row[tipoTarjeta],
            ultimosDigitos = row[ultimosDigitos],
            estado = row[estado],
            origen = row[origen],
            createdAt = row[createdAt].toInstant(ZoneOffset.UTC).toString(),
            updatedAt = row[updatedAt].toInstant(ZoneOffset.UTC).toString()
        )
    }
}
