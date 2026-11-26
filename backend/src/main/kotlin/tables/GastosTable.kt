package com.gestorgastos.tables

import com.gestorgastos.enums.TipoTarjeta
import com.gestorgastos.enums.OrigenMovimiento
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date
import org.jetbrains.exposed.sql.javatime.datetime
import org.jetbrains.exposed.sql.javatime.CurrentDateTime

object GastosTable : Table("gastos") {

    val id = integer("id").autoIncrement()

    val comercio = varchar("comercio", 255)

    val monto = decimal("monto", 12, 2)

    val categoria = varchar("categoria", 100)

    val banco = varchar("banco", 100).nullable()

    val fechaCargo = date("fecha_cargo")

    val tipoTarjeta = enumerationByName(
        "tipo_tarjeta",
        20,
        TipoTarjeta::class
    ).default(TipoTarjeta.DESCONOCIDO)

    val ultimosDigitos = varchar(
        "ultimos_digitos", 4
    ).nullable()

    val origen = enumerationByName(
        "origen",
        20,
        OrigenMovimiento::class
    ).default(OrigenMovimiento.MANUAL)

    val fechaRegistro = datetime("fecha_registro")
        .defaultExpression(CurrentDateTime)

    val suscripcionId = optReference("suscripcion_id", SuscripcionesTable.id, onDelete = ReferenceOption.SET_NULL)

    override val primaryKey = PrimaryKey(id)
}