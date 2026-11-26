import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  Alert, Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, MenuItem, TextField, Typography,
} from '@mui/material'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import CloseIcon from '@mui/icons-material/Close'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import TollOutlinedIcon from '@mui/icons-material/TollOutlined'
import { CATEGORIAS } from '../constants/categorias'
import { Monto, montoMaximo } from '../constants/montos'
import { filtrosIniciales, origenes, tarjetas } from '../constants/movimientos'

type Filtros = typeof filtrosIniciales

function Campo({ nombre, etiqueta, children }: {
  nombre: keyof Filtros
  etiqueta: string
  children: ReactNode
}) {
  return (
    <div className={nombre === 'origen' ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
      <Typography component="label" variant="body2" id={`etiqueta-${nombre}`} htmlFor={`filtro-${nombre}`} className="mb-1 block font-medium">
        {etiqueta}
      </Typography>
      {children}
    </div>
  )
}

function Seccion({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-[#cfd9ec] px-0 py-4 sm:px-3 sm:py-5">
      <Typography variant="subtitle1" component="h3" className="mb-2 flex items-center gap-2 text-[17px] font-bold">
        <span className="flex rounded-md bg-blue-50 p-0.5 text-blue-800">{icono}</span>
        {titulo}
      </Typography>
      <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export default function FiltrosMovimientos({ filtros, bancos, onAplicar, onCerrar }: {
  filtros: Filtros
  bancos: string[]
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

  function selector(nombre: 'tipoTarjeta' | 'origen', todos: string, opciones: Record<string, string>) {
    return (
      <TextField id={`filtro-${nombre}`} select fullWidth size="small" value={borrador[nombre]}
        onChange={e => cambiar(nombre, e.target.value)}
        slotProps={{ select: { displayEmpty: true, labelId: `etiqueta-${nombre}` } }}>
        <MenuItem value="">{todos}</MenuItem>
        {Object.entries(opciones).map(([valor, etiqueta]) => <MenuItem key={valor} value={valor}>{etiqueta}</MenuItem>)}
      </TextField>
    )
  }

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth={false}
      aria-labelledby="filtros-movimientos-titulo" aria-describedby="filtros-movimientos-descripcion"
      slotProps={{ paper: { sx: { maxWidth: 706, borderRadius: '22px', boxShadow: '0 20px 54px #17244440' } },
        backdrop: { sx: { bgcolor: '#202f505c' } } }}>
      <form onSubmit={aplicar} className="flex min-h-0 flex-col px-4 sm:px-7">
        <DialogTitle component="div" className="flex items-start gap-3.5 px-0 pt-4 pb-4 sm:pt-7 sm:pb-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#dbe5ff] text-blue-700 sm:size-14">
            <FilterAltOutlinedIcon sx={{ fontSize: 30 }} />
          </span>
          <div className="min-w-0 flex-1">
            <Typography component="h2" id="filtros-movimientos-titulo" className="text-[21px] leading-tight font-[750] sm:text-[27px]">
              Filtrar movimientos
            </Typography>
            <Typography id="filtros-movimientos-descripcion" variant="body2" className="mt-0.5 text-slate-700 sm:text-[16px]">
              Personaliza los movimientos que deseas consultar.
            </Typography>
          </div>
          <IconButton aria-label="Cerrar filtros" onClick={onCerrar} size="small" className="p-1.5 text-slate-900"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent className="campos-filtro-movimientos px-0 pt-0 pb-2 sm:pb-5">
          {error && <Alert className="mb-3" severity="error">{error}</Alert>}
          <Seccion titulo="Periodo" icono={<CalendarTodayOutlinedIcon sx={{ fontSize: 19 }} />}>
            {(['fechaDesde', 'fechaHasta'] as const).map(nombre => (
              <Campo key={nombre} nombre={nombre} etiqueta={nombre === 'fechaDesde' ? 'Fecha desde' : 'Fecha hasta'}>
                <div className="group relative">
                  <TextField id={`filtro-${nombre}`} fullWidth size="small" type="date" value={borrador[nombre]}
                    onChange={e => cambiar(nombre, e.target.value)}
                    sx={{
                      '& input': { pl: '40px' },
                      '& input::-webkit-calendar-picker-indicator': { position: 'absolute', left: 12, cursor: 'pointer' },
                      ...(!borrador[nombre] && { '& input:not(:focus)::-webkit-datetime-edit': { color: 'transparent' } }),
                    }} />
                  {!borrador[nombre] && (
                    <Typography component="span" variant="body2" color="text.secondary" aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-10 flex items-center group-focus-within:hidden">
                      Seleccionar fecha
                    </Typography>
                  )}
                </div>
              </Campo>
            ))}
          </Seccion>

          <Seccion titulo="Información del movimiento" icono={<SellOutlinedIcon sx={{ fontSize: 19 }} />}>
            {(['categoria', 'banco'] as const).map(nombre => (
              <Campo key={nombre} nombre={nombre} etiqueta={nombre === 'categoria' ? 'Categoría' : 'Banco'}>
                <Autocomplete id={`filtro-${nombre}`} size="small" freeSolo forcePopupIcon
                  openOnFocus options={nombre === 'categoria' ? CATEGORIAS : bancos}
                  inputValue={borrador[nombre]} clearText="Limpiar" openText="Mostrar opciones" closeText="Ocultar opciones"
                  noOptionsText="Escribe un valor"
                  onInputChange={(_, valor) => cambiar(nombre, valor)}
                  renderInput={params => <TextField {...params}
                    placeholder={nombre === 'categoria' ? 'Todas las categorías' : 'Todos los bancos'}
                    slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, maxLength: 100 } }} />} />
              </Campo>
            ))}
            <Campo nombre="tipoTarjeta" etiqueta="Tipo de tarjeta">
              {selector('tipoTarjeta', 'Todos los tipos', tarjetas)}
            </Campo>
            <Campo nombre="ultimosDigitos" etiqueta="Últimos cuatro dígitos">
              <TextField id="filtro-ultimosDigitos" fullWidth size="small" placeholder="Ej. 1234" value={borrador.ultimosDigitos}
                onChange={e => cambiar('ultimosDigitos', e.target.value.replace(/\D/g, '').slice(0, 4))}
                slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{4}' } }} />
            </Campo>
            <Campo nombre="origen" etiqueta="Origen del movimiento">
              {selector('origen', 'Todos los orígenes', origenes)}
            </Campo>
          </Seccion>

          <Seccion titulo="Rango de montos" icono={<TollOutlinedIcon sx={{ fontSize: 19 }} />}>
            {(['montoMinimo', 'montoMaximo'] as const).map(nombre => (
              <Campo key={nombre} nombre={nombre} etiqueta={nombre === 'montoMinimo' ? 'Monto mínimo' : 'Monto máximo'}>
                <TextField id={`filtro-${nombre}`} fullWidth size="small" type="number" value={borrador[nombre]}
                  placeholder={nombre === 'montoMinimo' ? '0.00' : 'Sin límite'} onChange={e => cambiar(nombre, e.target.value)}
                  slotProps={{
                    input: { startAdornment: nombre === 'montoMinimo' ? <InputAdornment position="start">$</InputAdornment> : undefined },
                    htmlInput: { min: 0, max: montoMaximo, step: 0.01 },
                  }} />
              </Campo>
            ))}
          </Seccion>
        </DialogContent>

        <DialogActions disableSpacing className="flex flex-wrap justify-end gap-3 border-t border-[#cfd9ec] px-0 pt-3 pb-4 sm:pt-5 sm:pb-7">
          <Button startIcon={<RestartAltIcon />} className="mr-auto min-h-11 gap-1 px-1.5 font-medium text-blue-700 hover:bg-blue-50"
            onClick={() => { setBorrador(filtrosIniciales); setError('') }}>Limpiar filtros</Button>
          <Button variant="outlined" color="inherit" className="min-h-11 rounded-lg border border-[#aebad1] px-4 font-medium hover:bg-slate-100 sm:px-7"
            onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" className="min-h-11 rounded-lg bg-[#164bd9] px-4 font-semibold text-white hover:bg-blue-800 sm:px-7">
            Aplicar filtros
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
