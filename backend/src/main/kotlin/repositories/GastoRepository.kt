package com.gestorgastos.repositories

import com.gestorgastos.models.Gasto
import com.gestorgastos.tables.GastosTable
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import com.gestorgastos.models.MovimientoExtraido
import com.gestorgastos.models.ImportacionResponse
import com.gestorgastos.enums.OrigenMovimiento
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import java.time.LocalDate
import com.gestorgastos.models.CrearGastoRequest
import com.gestorgastos.models.ConsultaGastos
import com.gestorgastos.models.OrdenGastos
import com.gestorgastos.models.PaginaGastos
import org.jetbrains.exposed.sql.statements.UpdateBuilder
import java.math.BigDecimal
import java.sql.Connection
import java.util.Locale


class GastoRepository {

    internal suspend fun consultar(consulta: ConsultaGastos): PaginaGastos =
        newSuspendedTransaction(Dispatchers.IO, transactionIsolation = Connection.TRANSACTION_REPEATABLE_READ) {
            val condicion = construirFiltro(consulta)
            val conteo = GastosTable.id.count()
            val suma = GastosTable.monto.sum()
            val resumen = GastosTable.select(conteo, suma).where { condicion }.single()
            val orden = when (consulta.ordenarPor) {
                OrdenGastos.FECHA -> GastosTable.fechaCargo
                OrdenGastos.MONTO -> GastosTable.monto
                OrdenGastos.COMERCIO -> GastosTable.comercio.lowerCase()
            }
            val direccion = if (consulta.ascendente) SortOrder.ASC else SortOrder.DESC
            val movimientos = GastosTable.selectAll()
                .where { condicion }
                .orderBy(orden to direccion, GastosTable.id to direccion)
                .limit(consulta.tamanoPagina)
                .offset(consulta.pagina.toLong() * consulta.tamanoPagina)
                .map(::aGasto)

            PaginaGastos(movimientos, resumen[conteo], resumen[suma] ?: BigDecimal.ZERO)
        }

    private fun construirFiltro(consulta: ConsultaGastos): Op<Boolean> = with(SqlExpressionBuilder) {
        val condiciones = listOfNotNull(
            consulta.comercio?.let {
                val literal = it.lowercase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
                GastosTable.comercio.lowerCase() like "%$literal%"
            },
            consulta.fechaDesde?.let { GastosTable.fechaCargo greaterEq it },
            consulta.fechaHasta?.let { GastosTable.fechaCargo lessEq it },
            consulta.categoria?.let { GastosTable.categoria eq it },
            consulta.banco?.let { GastosTable.banco eq it },
            consulta.tipoTarjeta?.let { GastosTable.tipoTarjeta eq it },
            consulta.ultimosDigitos?.let { GastosTable.ultimosDigitos eq it },
            consulta.origen?.let { GastosTable.origen eq it },
            consulta.montoMinimo?.let { GastosTable.monto greaterEq it },
            consulta.montoMaximo?.let { GastosTable.monto lessEq it }
        )
        condiciones.fold<Op<Boolean>, Op<Boolean>>(Op.TRUE) { filtro, siguiente -> filtro and siguiente }
    }

    private fun aGasto(row: ResultRow) = Gasto(
        id = row[GastosTable.id],
        comercio = row[GastosTable.comercio],
        monto = row[GastosTable.monto],
        categoria = row[GastosTable.categoria],
        banco = row[GastosTable.banco],
        fechaCargo = row[GastosTable.fechaCargo].toString(),
        tipoTarjeta = row[GastosTable.tipoTarjeta],
        ultimosDigitos = row[GastosTable.ultimosDigitos],
        origen = row[GastosTable.origen],
        fechaRegistro = row[GastosTable.fechaRegistro].toString()
    )

    private fun UpdateBuilder<*>.asignarCampos(gasto: CrearGastoRequest) {
        this[GastosTable.comercio] = gasto.comercio.trim()
        this[GastosTable.monto] = gasto.monto
        this[GastosTable.categoria] = gasto.categoria
        this[GastosTable.banco] = gasto.banco
        this[GastosTable.fechaCargo] = LocalDate.parse(gasto.fechaCargo)
        this[GastosTable.tipoTarjeta] = gasto.tipoTarjeta
        this[GastosTable.ultimosDigitos] = gasto.ultimosDigitos
    }

    suspend fun crear(gasto: CrearGastoRequest): Int =
        newSuspendedTransaction(Dispatchers.IO) {
            GastosTable.insert {
                it.asignarCampos(gasto)
                it[origen] = OrigenMovimiento.MANUAL
            } get GastosTable.id
        }

    suspend fun actualizar(id: Int, gasto: CrearGastoRequest): Boolean =
        newSuspendedTransaction(Dispatchers.IO) {
            GastosTable.update({ GastosTable.id eq id }) { it.asignarCampos(gasto) } > 0
        }

    suspend fun eliminar(ids: List<Int>): Int =
        newSuspendedTransaction(Dispatchers.IO) {
            ids.distinct().sorted().chunked(1000).sumOf { lote ->
                GastosTable.deleteWhere { GastosTable.id inList lote }
            }
        }

        suspend fun importarMovimientos(
    movimientos: List<MovimientoExtraido>,
    permitirCoincidencias: Boolean
): ImportacionResponse =
    newSuspendedTransaction(Dispatchers.IO) {

        val existentes = GastosTable.selectAll().toList()

        val (duplicados, nuevos) = movimientos.partition { movimiento ->

            existentes.any { row ->

                row[GastosTable.comercio].trim()
                    .equals(
                        movimiento.comercio.trim(),
                        ignoreCase = true
                    ) &&
                row[GastosTable.monto].compareTo(
                    movimiento.monto
                ) == 0 &&
                row[GastosTable.fechaCargo] ==
                    LocalDate.parse(movimiento.fechaCargo) &&
                row[GastosTable.banco]
                    ?.equals(
                        movimiento.banco,
                        ignoreCase = true
                    ) == true &&
                row[GastosTable.tipoTarjeta] ==
                    movimiento.tipoTarjeta &&
                row[GastosTable.ultimosDigitos] ==
                    movimiento.ultimosDigitos
            }
        }

        val porImportar = if (permitirCoincidencias) {
            movimientos
        } else if (duplicados.isNotEmpty()) {
            emptyList()
        } else {
            nuevos
        }

        if (porImportar.isNotEmpty()) {
            GastosTable.batchInsert(porImportar) { movimiento ->

                this[GastosTable.comercio] =
                    movimiento.comercio

                this[GastosTable.monto] =
                    movimiento.monto

                this[GastosTable.categoria] =
                    movimiento.categoria

                this[GastosTable.banco] =
                    movimiento.banco

                this[GastosTable.fechaCargo] =
                    LocalDate.parse(movimiento.fechaCargo)

                this[GastosTable.tipoTarjeta] =
                    movimiento.tipoTarjeta

                this[GastosTable.ultimosDigitos] =
                    movimiento.ultimosDigitos

                this[GastosTable.origen] =
                    OrigenMovimiento.PDF
            }
        }

        ImportacionResponse(
            importados = porImportar.size,
            posiblesDuplicados = duplicados,
            montoTotal = porImportar.sumOf {
                it.monto
            }
        )
    }
}