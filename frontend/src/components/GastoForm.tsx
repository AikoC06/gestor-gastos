import { Monto, montoMaximo } from '../constants/montos'
import CloseIcon from '@mui/icons-material/Close'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import TagIcon from '@mui/icons-material/Tag'
import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material'

import { CATEGORIAS } from '../constants/categorias'
import type { CrearGastoRequest } from '../types/CrearGastoRequest'
import type { Gasto } from '../types/Gasto'

const iconoCampo = (icon: ReactNode) => ({ startAdornment: <InputAdornment position="start">{icon}</InputAdornment> })

interface Props {
  open: boolean
  gasto?: Gasto
  onClose: () => void
  onSubmit: (gasto: CrearGastoRequest) => Promise<void>
}

function fechaActual(): string {
  const fecha = new Date()

  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
  ].join('-')
}

const estadoInicial = (gasto?: Gasto): Omit<CrearGastoRequest, 'banco' | 'ultimosDigitos'> & { banco: string; ultimosDigitos: string } => ({
  comercio: gasto?.comercio ?? '',
  monto: gasto?.monto ?? '',
  categoria: gasto?.categoria ?? 'Sin clasificar',
  banco: gasto?.banco ?? '',
  fechaCargo: gasto?.fechaCargo ?? fechaActual(),
  tipoTarjeta: gasto?.tipoTarjeta ?? 'DESCONOCIDO',
  ultimosDigitos: gasto?.ultimosDigitos ?? '',
})

export default function GastoForm({
  open,
  gasto,
  onClose,
  onSubmit,
}: Props) {

  const [form, setForm] = useState(() => estadoInicial(gasto))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function actualizar<K extends keyof typeof form>(
    campo: K,
    valor: (typeof form)[K]
  ) {
    setForm(anterior => ({
      ...anterior,
      [campo]: valor,
    }))
  }

  function cerrar() {
    if (guardando) return

    setForm(estadoInicial(gasto))
    setError(null)
    onClose()
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!/^\d+(\.\d{1,2})?$/.test(form.monto)) {
      setError('Ingresa un monto válido con máximo dos decimales')
      return
    }

    const monto = new Monto(form.monto)

    if (!monto.gt(0) || monto.gt(montoMaximo)) {
      setError('El monto es inválido')
      return
    }

    if (
      form.ultimosDigitos &&
      !/^\d{4}$/.test(form.ultimosDigitos)
    ) {
      setError('Ingresa exactamente cuatro dígitos')
      return
    }

    setGuardando(true)

    try {
      await onSubmit({
        comercio: form.comercio.trim(),
        monto: monto.toFixed(2),
        categoria: form.categoria,
        banco: form.banco.trim() || null,
        fechaCargo: form.fechaCargo,
        tipoTarjeta: form.tipoTarjeta,
        ultimosDigitos: form.ultimosDigitos || null,
      })

      setForm(estadoInicial(gasto))
      onClose()

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Error inesperado'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      fullWidth
      aria-labelledby="nuevo-gasto-titulo"
      maxWidth="md"
      slotProps={{ paper: { sx: { maxWidth: 700 } }, backdrop: { sx: { backgroundColor: '#101d3d66' } } }}
    >
      <form onSubmit={guardar}>

        <DialogTitle id="nuevo-gasto-titulo" className="flex items-center gap-3 px-5 py-5 text-2xl font-bold sm:px-8">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <CreditCardOutlinedIcon />
          </span>
          {gasto ? 'Editar movimiento' : 'Nuevo movimiento'}
          <IconButton aria-label="Cerrar" onClick={cerrar} disabled={guardando} className="ml-auto"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent className="px-5 sm:px-8">
          <div className="flex flex-col gap-5 pt-2 pb-2">

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <TextField
              label="Comercio"
              slotProps={{ input: iconoCampo(<StorefrontOutlinedIcon fontSize="small" />) }}
              value={form.comercio}
              onChange={e =>
                actualizar('comercio', e.target.value)
              }
              required
              fullWidth
            />

            <TextField
              label="Monto (MXN)"
              type="number"
              value={form.monto}
              onChange={e =>
                actualizar('monto', e.target.value)
              }
              slotProps={{
                input: iconoCampo(<PaymentsOutlinedIcon fontSize="small" />),
                htmlInput: {
                  min: 0.01,
                  step: 0.01,
                },
              }}
              required
              fullWidth
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <TextField
                label="Fecha del cargo"
                type="date"
                value={form.fechaCargo}
                onChange={e =>
                  actualizar('fechaCargo', e.target.value)
                }
                slotProps={{
                  inputLabel: { shrink: true },
                  input: iconoCampo(<CalendarTodayOutlinedIcon fontSize="small" />),
                }}
                required
                fullWidth
              />

              <TextField
                select
                label="Categoría"
              slotProps={{ input: iconoCampo(<SellOutlinedIcon fontSize="small" />) }}
                value={form.categoria}
                onChange={e =>
                  actualizar('categoria', e.target.value)
                }
                fullWidth
              >
                {!CATEGORIAS.includes(form.categoria) && <MenuItem value={form.categoria}>{form.categoria}</MenuItem>}
                {CATEGORIAS.map(categoria => (
                  <MenuItem
                    key={categoria}
                    value={categoria}
                  >
                    {categoria}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Banco"
              slotProps={{ input: iconoCampo(<AccountBalanceOutlinedIcon fontSize="small" />) }}
                value={form.banco}
                onChange={e =>
                  actualizar('banco', e.target.value)
                }
                fullWidth
              />

              <TextField
                select
                label="Tipo de tarjeta"
              slotProps={{ input: iconoCampo(<CreditCardOutlinedIcon fontSize="small" />) }}
                value={form.tipoTarjeta}
                onChange={e =>
                  actualizar(
                    'tipoTarjeta',
                    e.target.value as CrearGastoRequest['tipoTarjeta']
                  )
                }
                fullWidth
              >
                <MenuItem value="DESCONOCIDO">
                  No especificado
                </MenuItem>

                <MenuItem value="CREDITO">
                  Crédito
                </MenuItem>

                <MenuItem value="DEBITO">
                  Débito
                </MenuItem>
              </TextField>

            </div>

            <TextField
              label="Últimos cuatro dígitos"
              slotProps={{ input: iconoCampo(<TagIcon fontSize="small" />) }}
              value={form.ultimosDigitos}
              onChange={e =>
                actualizar(
                  'ultimosDigitos',
                  e.target.value.replace(/\D/g, '').slice(0, 4)
                )
              }
              helperText="Opcional"
              fullWidth
            />

          </div>
        </DialogContent>

        <DialogActions className="border-t border-[#dbe3ef] px-5 sm:px-8">
          <Button
            onClick={cerrar}
            disabled={guardando}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={guardando}
            startIcon={
              guardando
                ? <CircularProgress size={18} />
                : <SaveOutlinedIcon />
            }
          >
            {guardando ? 'Guardando...' : gasto ? 'Guardar cambios' : 'Guardar gasto'}
          </Button>
        </DialogActions>

      </form>
    </Dialog>
  )
}