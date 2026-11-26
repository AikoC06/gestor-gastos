import type { GuardarSuscripcionRequest, ResumenSuscripciones, SugerenciaSuscripcion, Suscripcion } from '../types/Suscripcion'

const URL_SUSCRIPCIONES = 'http://localhost:8080/suscripciones'

async function solicitar(ruta: string, mensaje: string, opciones?: RequestInit) {
  const respuesta = await fetch(URL_SUSCRIPCIONES + ruta, opciones)
  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => null)
    throw new Error(detalle?.errores?.join(', ') ?? detalle?.error ?? mensaje)
  }
  return respuesta
}

export async function listarSuscripciones(signal?: AbortSignal): Promise<Suscripcion[]> {
  const respuesta = await solicitar('', 'No se pudieron cargar las suscripciones', { signal })
  return respuesta.json()
}

export async function obtenerResumenSuscripciones(signal?: AbortSignal): Promise<ResumenSuscripciones> {
  const respuesta = await solicitar('/resumen', 'No se pudo cargar el resumen', { signal })
  return respuesta.json()
}

export async function guardarSuscripcion(datos: GuardarSuscripcionRequest, id?: number): Promise<Suscripcion> {
  const respuesta = await solicitar(id === undefined ? '' : `/${id}`, 'No se pudo guardar la suscripción', {
    method: id === undefined ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  return respuesta.json()
}

export async function eliminarSuscripcion(id: number): Promise<void> {
  await solicitar(`/${id}`, 'No se pudo eliminar la suscripción', { method: 'DELETE' })
}

export async function consultarSugerencias(signal?: AbortSignal, analizar = false): Promise<SugerenciaSuscripcion[]> {
  const respuesta = await solicitar(analizar ? '/sugerencias/analizar' : '/sugerencias',
    'No se pudieron analizar los movimientos', { signal, method: analizar ? 'POST' : 'GET' })
  return respuesta.json()
}

export async function confirmarSugerencia(sugerencia: SugerenciaSuscripcion, datos: GuardarSuscripcionRequest): Promise<void> {
  const { nombre, monto, frecuencia, proximoCobro } = datos
  await solicitar(`/sugerencias/${sugerencia.id}/confirmar`, 'No se pudo confirmar la suscripción', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, monto, frecuencia, proximoCobro, movimientosIds: sugerencia.movimientosIds }),
  })
}

export async function descartarSugerencia(id: string): Promise<void> {
  await solicitar(`/sugerencias/${id}/descartar`, 'No se pudo descartar la sugerencia', { method: 'POST' })
}
