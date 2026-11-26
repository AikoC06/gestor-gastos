import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import { CATEGORIAS } from '../constants/categorias'
import { Monto, montoMaximo } from '../constants/montos'
import { filtrosIniciales, origenes, tarjetas } from '../constants/movimientos'

type Filtros = typeof filtrosIniciales

export default function FiltrosMovimientos({ filtros, onAplicar, onCerrar }: {
  filtros: Filtros
  onAplicar: (filtros: Filtros) => void
  onCerrar: () => void
}) {
  const [borrador, setBorrador] = useState(filtros)
  const [error, setError] = useState('')

  function cambiar(campo: keyof Filtros, valor: string) {
    setBorrador(actual => ({ ...actual, [campo]: valor }))
    setError('')
  }

  function aplicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const { fechaDesde, fechaHasta, montoMinimo, montoMaximo } = borrador
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      setError('La fecha inicial debe ser anterior o igual a la fecha final')
      return
    }
    if ([montoMinimo, montoMaximo].some(monto => monto && !/^[0-9]+(\.[0-9]{1,2})?$/.test(monto))) {
      setError('Ingresa montos con un máximo de dos decimales')
      return
    }
    if (montoMinimo && montoMaximo && new Monto(montoMinimo).gt(montoMaximo)) {
      setError('El monto mínimo debe ser menor o igual al monto máximo')
      return
    }
    onAplicar({ ...borrador, categoria: borrador.categoria.trim(), banco: borrador.banco.trim() })
  }

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="sm" aria-labelledby="filtros-movimientos-titulo">
      <form onSubmit={aplicar}>
        <DialogTitle id="filtros-movimientos-titulo">Filtrar movimientos</DialogTitle>
        <DialogContent>
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            {error && <Alert className="sm:col-span-2" severity="error">{error}</Alert>}
            <TextField label="Fecha desde" type="date" value={borrador.fechaDesde}
              onChange={e => cambiar('fechaDesde', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Fecha hasta" type="date" value={borrador.fechaHasta}
              onChange={e => cambiar('fechaHasta', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <Autocomplete freeSolo options={CATEGORIAS} inputValue={borrador.categoria}
              onInputChange={(_, valor) => cambiar('categoria', valor)}
              renderInput={params => <TextField {...params} label="Categoría" />} />
            <TextField label="Banco" value={borrador.banco} onChange={e => cambiar('banco', e.target.value)}
              slotProps={{ htmlInput: { maxLength: 100 } }} />
            <TextField select label="Tipo de tarjeta" value={borrador.tipoTarjeta} onChange={e => cambiar('tipoTarjeta', e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
              <MenuItem value="">Todas</MenuItem>
              {Object.entries(tarjetas).map(([valor, etiqueta]) => <MenuItem key={valor} value={valor}>{etiqueta}</MenuItem>)}
            </TextField>
            <TextField label="Últimos cuatro dígitos" value={borrador.ultimosDigitos}
              onChange={e => cambiar('ultimosDigitos', e.target.value.replace(/\D/g, '').slice(0, 4))}
              slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{4}' } }} />
            <TextField select label="Origen" value={borrador.origen} onChange={e => cambiar('origen', e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(origenes).map(([valor, etiqueta]) => <MenuItem key={valor} value={valor}>{etiqueta}</MenuItem>)}
            </TextField>
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
              {(['montoMinimo', 'montoMaximo'] as const).map(campo => (
                <TextField key={campo} label={campo === 'montoMinimo' ? 'Monto mínimo (MXN)' : 'Monto máximo (MXN)'}
                  type="number" value={borrador[campo]} onChange={e => cambiar(campo, e.target.value)}
                  slotProps={{ htmlInput: { min: 0, max: montoMaximo, step: 0.01 } }} />
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained">Aplicar filtros</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
