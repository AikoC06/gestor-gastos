package com.gestorgastos.tables

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table

object DecisionesSuscripcionTable : Table("decisiones_suscripcion") {
    val id = varchar("id", 64)
    val suscripcionId = optReference("suscripcion_id", SuscripcionesTable.id, onDelete = ReferenceOption.CASCADE)
    override val primaryKey = PrimaryKey(id)
}
