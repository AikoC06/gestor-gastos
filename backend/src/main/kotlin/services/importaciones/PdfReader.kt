package com.gestorgastos.services.importaciones

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.apache.pdfbox.Loader
import org.apache.pdfbox.text.PDFTextStripper

class PdfReader {

    suspend fun extraerTexto(
        contenido: ByteArray
    ): String = withContext(Dispatchers.IO) {

        Loader.loadPDF(contenido).use { documento ->

            PDFTextStripper().apply {
                sortByPosition = true
            }.getText(documento)

        }
    }
}