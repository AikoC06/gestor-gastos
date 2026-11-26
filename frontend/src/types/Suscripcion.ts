import type { Gasto } from './Gasto'

export type FrecuenciaSuscripcion = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
export type EstadoSuscripcion = 'ACTIVA' | 'PAUSADA' | 'CANCELADA'
export type OrigenSuscripcion = 'MANUAL' | 'AUTOMATICA'

export interface GuardarSuscripcionRequest {
  nombre: string
  comercio: string
  monto: string
  categoria: string
  frecuencia: FrecuenciaSuscripcion
  fechaInicio: string | null
  proximoCobro: string | null
  banco: string | null
  tipoTarjeta: Gasto['tipoTarjeta']
  ultimosDigitos: string | null
  estado: EstadoSuscripcion
}

export interface Suscripcion extends GuardarSuscripcionRequest {
  id: number
  origen: OrigenSuscripcion
  createdAt: string
  updatedAt: string
}

export interface ResumenSuscripciones {
  activas: number
  costoMensual: string
  costoAnual: string
  proximosCobros: { suscripcionId: number; nombre: string; fecha: string; monto: string }[]
}
