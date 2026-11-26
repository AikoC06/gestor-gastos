import Decimal from 'decimal.js'

// Los totales pueden superar el límite de un movimiento individual.
export const Monto = Decimal.clone({ precision: 32 })
export const montoMaximo = '9999999999.99'

export function sumarMontos(montos: readonly Decimal.Value[]) {
  return montos.reduce<Decimal>((total, monto) => total.plus(monto), new Monto(0))
}

export function compararMontos(a: string | null | undefined, b: string | null | undefined) {
  return new Monto(a ?? 0).cmp(b ?? 0)
}
