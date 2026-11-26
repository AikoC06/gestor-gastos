package com.gestorgastos.serialization

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonPrimitive
import java.math.BigDecimal

object BigDecimalSerializer : KSerializer<BigDecimal> {

    override val descriptor = PrimitiveSerialDescriptor("BigDecimal", PrimitiveKind.STRING)

    private val decimal = Regex("""-?[0-9]+(?:\.[0-9]+)?""")

    override fun serialize(encoder: Encoder, value: BigDecimal) {
        encoder.encodeString(value.toPlainString())
    }

    override fun deserialize(decoder: Decoder): BigDecimal {
        val texto = if (decoder is JsonDecoder) {
            val elemento = decoder.decodeJsonElement()
            if (elemento !is JsonPrimitive || !elemento.isString) {
                throw SerializationException("Se esperaba una cadena decimal")
            }
            elemento.content
        } else {
            decoder.decodeString()
        }

        return texto.takeIf(decimal::matches)?.toBigDecimalOrNull()
            ?: throw SerializationException("Cadena decimal inválida")
    }
}
