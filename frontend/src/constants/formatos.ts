import type Decimal from 'decimal.js'

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function formatoMoneda(monto: string | Decimal) {
  return moneda.format((typeof monto === 'string' ? monto : monto.toFixed()) as `${number}`)
}

const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const mes = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const periodoActual = () => new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric', month: '2-digit', timeZone: 'America/Mexico_City',
}).format(new Date())

export const nombreMes = (periodo: string) => mes.format(new Date(periodo + '-01T00:00:00Z'))

export function formatoFecha(valor: string) {
  const fechaCargo = new Date(valor.slice(0, 10) + 'T00:00:00Z')
  return Number.isNaN(fechaCargo.getTime()) ? valor : fecha.format(fechaCargo)
}
