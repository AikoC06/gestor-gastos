package com.gestorgastos.tables

import com.gestorgastos.enums.EstadoSuscripcion
import com.gestorgastos.enums.FrecuenciaSuscripcion
import com.gestorgastos.enums.OrigenSuscripcion
import com.gestorgastos.enums.TipoTarjeta
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.CurrentDateTime
import org.jetbrains.exposed.sql.javatime.date
import org.jetbrains.exposed.sql.javatime.datetime

object SuscripcionesTable : Table("suscripciones") {
    val id = integer("id").autoIncrement()
    val nombre = varchar("nombre", 255)
    val comercio = varchar("comercio", 255)
    val monto = decimal("monto", 12, 2)
    val categoria = varchar("categoria", 100)
    val frecuencia = enumerationByName<FrecuenciaSuscripcion>("frecuencia", 20)
    val fechaInicio = date("fecha_inicio").nullable()
    val proximoCobro = date("proximo_cobro").nullable()
    val banco = varchar("banco", 100).nullable()
    val tipoTarjeta = enumerationByName<TipoTarjeta>("tipo_tarjeta", 20).default(TipoTarjeta.DESCONOCIDO)
    val ultimosDigitos = varchar("ultimos_digitos", 4).nullable()
    val estado = enumerationByName<EstadoSuscripcion>("estado", 20).default(EstadoSuscripcion.ACTIVA)
    val origen = enumerationByName<OrigenSuscripcion>("origen", 20).default(OrigenSuscripcion.MANUAL)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    val updatedAt = datetime("updated_at").defaultExpression(CurrentDateTime)

    override val primaryKey = PrimaryKey(id)
}
