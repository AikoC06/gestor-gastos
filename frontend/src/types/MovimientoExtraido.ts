export interface MovimientoExtraido {
  comercio: string
  monto: string
  fechaCargo: string
  categoria: string
  banco: string
  tipoTarjeta: 'CREDITO' | 'DEBITO' | 'DESCONOCIDO'
  ultimosDigitos: string | null
}