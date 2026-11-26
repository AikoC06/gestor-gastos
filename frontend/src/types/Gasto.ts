export interface Gasto {
  id: number
  comercio: string
  monto: string
  categoria: string
  banco: string | null
  fechaCargo: string
  tipoTarjeta: 'CREDITO' | 'DEBITO' | 'DESCONOCIDO'
  ultimosDigitos: string | null
  origen: 'CORREO' | 'CSV' | 'MANUAL' |'PDF'
  fechaRegistro: string
}