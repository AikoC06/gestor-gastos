package com.gestorgastos

import com.gestorgastos.config.DatabaseFactory

fun main(args: Array<String>) {
    DatabaseFactory.init()

    io.ktor.server.netty.EngineMain.main(args)
}