export interface CrearGastoRequest {
  comercio: string
  monto: string
  categoria: string
  banco: string | null
  fechaCargo: string
  tipoTarjeta: 'CREDITO' | 'DEBITO' | 'DESCONOCIDO'
  ultimosDigitos: string | null
}