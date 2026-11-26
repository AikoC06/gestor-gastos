import type { MovimientoExtraido } from '../types/MovimientoExtraido'
const API_URL = 'http://localhost:8080'

export interface PdfResponse {
  nombreArchivo: string
  texto: string
  movimientos: MovimientoExtraido[]
  totalMovimientos: number
  montoTotal: string
}

export async function importarPdf(
  archivo: File
): Promise<PdfResponse> {
  const formData = new FormData()

  formData.append('archivo', archivo)

  const response = await fetch(
    `${API_URL}/importaciones/pdf`,
    {
      method: 'POST',
      body: formData,
    }
  )

if (!response.ok) {
  const contenido = await response.text()

  console.error('Status:', response.status)

  throw new Error(
    `Error ${response.status}: ${contenido || response.statusText}`
  )
}

  return response.json()
}

export interface ImportacionResponse {
  importados: number
  posiblesDuplicados: MovimientoExtraido[]
  montoTotal: string
}

export async function confirmarImportacion(
  movimientos: MovimientoExtraido[],
  permitirCoincidencias = false
): Promise<ImportacionResponse> {

  const response = await fetch(
    `${API_URL}/importaciones/confirmar`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movimientos,
        permitirCoincidencias,
      }),
    }
  )

  if (response.status === 409) {
    return response.json()
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)

    throw new Error(
      error?.error ?? 'No se pudo guardar la importación'
    )
  }

  return response.json()
}