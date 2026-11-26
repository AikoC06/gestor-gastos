import type { FiltrosGastos } from '../services/gastosService'

export const tarjetas = { CREDITO: 'Crédito', DEBITO: 'Débito', DESCONOCIDO: 'No especificado' }
export const origenes = { MANUAL: 'Manual', PDF: 'Estado de cuenta', CSV: 'CSV', CORREO: 'Correo' }

export const filtrosIniciales = {
  fechaDesde: '', fechaHasta: '', categoria: '', banco: '', tipoTarjeta: '',
  ultimosDigitos: '', origen: '', montoMinimo: '', montoMaximo: '',
} satisfies Omit<FiltrosGastos, 'comercio'>
