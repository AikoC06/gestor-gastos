import type { GuardarSuscripcionRequest, ResumenSuscripciones, Suscripcion } from '../types/Suscripcion'

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
