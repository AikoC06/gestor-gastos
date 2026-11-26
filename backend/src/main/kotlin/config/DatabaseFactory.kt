package com.gestorgastos.config

import com.gestorgastos.tables.GastosTable
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {

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

        transaction {
            SchemaUtils.create(GastosTable)
        }

        println("PostgreSQL conectado correctamente")
    }
}