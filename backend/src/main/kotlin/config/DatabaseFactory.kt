package com.gestorgastos.config

import com.gestorgastos.tables.DecisionesSuscripcionTable
import com.gestorgastos.tables.GastosTable
import com.gestorgastos.tables.SuscripcionesTable
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {

    fun prepararEsquema() = transaction {
        SchemaUtils.create(SuscripcionesTable, GastosTable, DecisionesSuscripcionTable)
        exec(
            """
            ALTER TABLE gastos ADD COLUMN IF NOT EXISTS suscripcion_id INTEGER
                REFERENCES suscripciones(id) ON DELETE SET NULL
            """.trimIndent()
        )
    }

    fun init() {
        val config = HikariConfig().apply {
            jdbcUrl = "jdbc:postgresql://localhost:5432/gestor_gastos"
            driverClassName = "org.postgresql.Driver"
            username = "postgres"
            password = ""
            maximumPoolSize = 5
        }

        val dataSource = HikariDataSource(config)

        Database.connect(dataSource)

        prepararEsquema()

        println("PostgreSQL conectado correctamente")
    }
}