import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatoMoneda } from '../src/constants/formatos.ts'
import { compararMontos, sumarMontos } from '../src/constants/montos.ts'

test('suma importes sin redondear los centavos', () => {
  assert.equal(sumarMontos(['0.10', '0.20']).toFixed(2), '0.30')
  assert.equal(sumarMontos(['9999999999.99', '0.01']).toFixed(2), '10000000000.00')
  assert.equal(sumarMontos([]).toFixed(2), '0.00')
})

test('ordena montos numéricamente y compara escalas equivalentes', () => {
  assert.deepEqual(['10.00', '2.50', '1.00'].sort(compararMontos), ['1.00', '2.50', '10.00'])
  assert.equal(compararMontos('95.5', '95.50'), 0)
})

test('presenta cadenas y totales exactos como moneda MXN', () => {
  assert.equal(formatoMoneda('95.50'), '$95.50')
  assert.equal(formatoMoneda(sumarMontos(['9007199254740992.00', '0.01'])), '$9,007,199,254,740,992.01')
})
