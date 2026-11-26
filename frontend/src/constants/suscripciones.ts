import type { EstadoSuscripcion, FrecuenciaSuscripcion } from '../types/Suscripcion'

export const frecuencias: Record<FrecuenciaSuscripcion, string> = {
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
}

export const estadosSuscripcion: Record<EstadoSuscripcion, string> = {
  ACTIVA: 'Activa',
  PAUSADA: 'Pausada',
  CANCELADA: 'Cancelada',
}
