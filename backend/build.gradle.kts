
plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(ktorLibs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)
}

group = "com.gestorgastos"
version = "1.0.0-SNAPSHOT"

application {
    mainClass.set("com.gestorgastos.MainKt")
}

kotlin {
    jvmToolchain(21)
}
dependencies {
    implementation(ktorLibs.serialization.kotlinx.json)
    implementation(ktorLibs.server.config.yaml)
    implementation(ktorLibs.server.contentNegotiation)
    implementation(ktorLibs.server.core)
    implementation(ktorLibs.server.cors)
    implementation(ktorLibs.server.netty)
    implementation(libs.logback.classic)

    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)


    // Exposed
    implementation("org.jetbrains.exposed:exposed-core:0.61.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.61.0")
    implementation("org.jetbrains.exposed:exposed-java-time:0.61.0")

    // PostgreSQL
    implementation("org.postgresql:postgresql:42.7.5")

    // HikariCP
    implementation("com.zaxxer:HikariCP:6.3.0")

    // Testing
    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)

    //tools
    // PDF processing
implementation("org.apache.pdfbox:pdfbox:3.0.6")
    

}
