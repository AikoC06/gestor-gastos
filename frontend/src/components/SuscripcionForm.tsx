import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import RepeatIcon from '@mui/icons-material/Repeat'
import { CATEGORIAS } from '../constants/categorias'
import { Monto, montoMaximo } from '../constants/montos'
import { tarjetas } from '../constants/movimientos'
import { frecuencias } from '../constants/suscripciones'
import type { GuardarSuscripcionRequest, Suscripcion } from '../types/Suscripcion'

const valoresIniciales: GuardarSuscripcionRequest = {
  nombre: '', comercio: '', monto: '', categoria: 'Sin clasificar',
  frecuencia: 'MENSUAL', fechaInicio: null, proximoCobro: null,
  banco: null, tipoTarjeta: 'DESCONOCIDO', ultimosDigitos: null, estado: 'ACTIVA',
}

export default function SuscripcionForm({ suscripcion, onCerrar, onGuardar }: {
  suscripcion?: Suscripcion
  onCerrar: () => void
  onGuardar: (datos: GuardarSuscripcionRequest) => Promise<void>
}) {
  const [form, setForm] = useState<GuardarSuscripcionRequest>(suscripcion ?? valoresIniciales)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function cambiar<K extends keyof GuardarSuscripcionRequest>(campo: K, valor: GuardarSuscripcionRequest[K]) {
    setForm(actual => ({ ...actual, [campo]: valor }))
    setError('')
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (guardando) return
    if (!/^\d+(\.\d{1,2})?$/.test(form.monto)) {
      setError('Ingresa un monto válido con máximo dos decimales')
      return
    }
    const monto = new Monto(form.monto)
    if (!monto.gt(0) || monto.gt(montoMaximo)) {
      setError('El monto es inválido')
      return
    }
    if (form.fechaInicio && form.proximoCobro && form.proximoCobro < form.fechaInicio) {
      setError('El próximo cobro debe ser igual o posterior a la fecha de inicio')
      return
    }

    setGuardando(true)
    try {
      await onGuardar({
        nombre: form.nombre.trim(),
        comercio: form.comercio.trim(),
        monto: monto.toFixed(2),
        categoria: form.categoria,
        frecuencia: form.frecuencia,
        fechaInicio: form.fechaInicio || null,
        proximoCobro: form.proximoCobro || null,
        banco: form.banco?.trim() || null,
        tipoTarjeta: form.tipoTarjeta,
        ultimosDigitos: form.ultimosDigitos || null,
        estado: form.estado,
      })
      onCerrar()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo guardar la suscripción')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open onClose={guardando ? undefined : onCerrar} fullWidth maxWidth="sm"
      aria-labelledby="suscripcion-form-titulo">
      <form onSubmit={guardar} className="formulario-suscripcion flex min-h-0 flex-col">
        <DialogTitle id="suscripcion-form-titulo" className="flex items-center gap-3 px-5 pt-5 pb-3 text-xl font-bold sm:px-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><RepeatIcon /></span>
          {suscripcion ? 'Editar suscripción' : 'Nueva suscripción'}
        </DialogTitle>
        <DialogContent className="grid gap-4 px-5 py-3 sm:grid-cols-2 sm:px-6">
          {error && <Alert severity="error" className="sm:col-span-2">{error}</Alert>}
          <TextField id="suscripcion-nombre" label="Nombre" required value={form.nombre} onChange={e => cambiar('nombre', e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 255 } }} />
          <TextField id="suscripcion-comercio" label="Comercio" required value={form.comercio} onChange={e => cambiar('comercio', e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 255 } }} />
          <TextField id="suscripcion-monto" label="Monto (MXN)" type="number" required value={form.monto} onChange={e => cambiar('monto', e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0.01, max: montoMaximo, step: 0.01 } }} />
          <TextField id="suscripcion-categoria" select label="Categoría" value={form.categoria} onChange={e => cambiar('categoria', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}>
            {!CATEGORIAS.includes(form.categoria) && <MenuItem value={form.categoria}>{form.categoria}</MenuItem>}
            {CATEGORIAS.map(categoria => <MenuItem key={categoria} value={categoria}>{categoria}</MenuItem>)}
          </TextField>
          <TextField id="suscripcion-frecuencia" select label="Frecuencia" value={form.frecuencia}
            onChange={e => cambiar('frecuencia', e.target.value as GuardarSuscripcionRequest['frecuencia'])}
            slotProps={{ inputLabel: { shrink: true } }}>
            {Object.entries(frecuencias).map(([valor, etiqueta]) => <MenuItem key={valor} value={valor}>{etiqueta}</MenuItem>)}
          </TextField>
          <TextField id="suscripcion-banco" label="Banco" value={form.banco ?? ''} onChange={e => cambiar('banco', e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 100 } }} />
          <TextField id="suscripcion-inicio" label="Fecha de inicio" type="date" value={form.fechaInicio ?? ''}
            onChange={e => cambiar('fechaInicio', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField id="suscripcion-proximo" label="Próximo cobro" type="date" value={form.proximoCobro ?? ''}
            onChange={e => cambiar('proximoCobro', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField id="suscripcion-tarjeta" select label="Tipo de tarjeta" value={form.tipoTarjeta}
            onChange={e => cambiar('tipoTarjeta', e.target.value as GuardarSuscripcionRequest['tipoTarjeta'])}
            slotProps={{ inputLabel: { shrink: true } }}>
            {Object.entries(tarjetas).map(([valor, etiqueta]) => <MenuItem key={valor} value={valor}>{etiqueta}</MenuItem>)}
          </TextField>
          <TextField id="suscripcion-digitos" label="Últimos cuatro dígitos" value={form.ultimosDigitos ?? ''}
            onChange={e => cambiar('ultimosDigitos', e.target.value.replace(/\D/g, '').slice(0, 4))}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { inputMode: 'numeric', pattern: '[0-9]{4}' } }} />
        </DialogContent>
        <DialogActions className="gap-2 border-t border-slate-200 px-5 py-4">
          <Button className="rounded-lg px-4 py-2 font-semibold hover:bg-slate-100" disabled={guardando} onClick={onCerrar}>Cancelar</Button>
          <Button className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            type="submit" variant="contained" disabled={guardando}
            startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {guardando ? 'Guardando…' : suscripcion ? 'Guardar cambios' : 'Registrar suscripción'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
