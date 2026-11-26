import type { Gasto } from '../types/Gasto'
import type { CrearGastoRequest } from '../types/CrearGastoRequest'

const URL_GASTOS = 'http://localhost:8080/gastos'

export interface FiltrosGastos {
  comercio: string
  fechaDesde: string
  fechaHasta: string
  categoria: string
  banco: string
  tipoTarjeta: string
  ultimosDigitos: string
  origen: string
  montoMinimo: string
  montoMaximo: string
}

export interface ConsultaGastos extends Partial<FiltrosGastos> {
  pagina?: number
  tamanoPagina?: number
  ordenarPor?: 'fecha' | 'monto' | 'comercio'
  direccion?: 'asc' | 'desc'
}

export interface PaginaGastos {
  movimientos: Gasto[]
  totalRegistros: number
  montoTotal: string
}

async function verificarRespuesta(response: Response, mensaje: string) {
  if (response.ok) return

  const detalle = await response.json().catch(() => null)
  throw new Error(detalle?.errores?.join(', ') ?? detalle?.error ?? mensaje)
}

export async function consultarGastos(consulta: ConsultaGastos, signal?: AbortSignal): Promise<PaginaGastos> {
  const parametros = new URLSearchParams()
  for (const [clave, valor] of Object.entries(consulta)) {
    if (valor !== undefined && valor !== '') parametros.set(clave, String(valor))
  }

  const response = await fetch(`${URL_GASTOS}?${parametros}`, { signal })
  await verificarRespuesta(response, 'No se pudieron obtener los gastos')
  return response.json()
}

export async function obtenerGastos(signal?: AbortSignal): Promise<Gasto[]> {
  const tamanoPagina = 100
  const gastos: Gasto[] = []

  for (let pagina = 0; ; pagina++) {
    const resultado = await consultarGastos({ pagina, tamanoPagina }, signal)
    gastos.push(...resultado.movimientos)
    if (gastos.length >= resultado.totalRegistros || resultado.movimientos.length < tamanoPagina) {
      return gastos
    }
  }
}

function solicitudJson(method: 'POST' | 'PUT', cuerpo: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  }
}

export async function crearGasto(gasto: CrearGastoRequest): Promise<{ id: number }> {
  const response = await fetch(URL_GASTOS, solicitudJson('POST', gasto))
  await verificarRespuesta(response, 'No se pudo registrar el gasto')
  return response.json()
}

export async function actualizarGasto(id: number, gasto: CrearGastoRequest): Promise<void> {
  const response = await fetch(`${URL_GASTOS}/${id}`, solicitudJson('PUT', gasto))
  await verificarRespuesta(response, 'No se pudo actualizar el movimiento')
}

export async function eliminarGasto(id: number): Promise<void> {
  const response = await fetch(`${URL_GASTOS}/${id}`, { method: 'DELETE' })
  await verificarRespuesta(response, 'No se pudo eliminar el movimiento')
}

export async function eliminarGastos(ids: readonly number[]): Promise<{ eliminados: number }> {
  const response = await fetch(`${URL_GASTOS}/eliminacion-multiple`, solicitudJson('POST', { ids }))
  await verificarRespuesta(response, 'No se pudieron eliminar los movimientos')
  return response.json()
}
