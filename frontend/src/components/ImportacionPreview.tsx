import { sumarMontos, compararMontos } from '../constants/montos'
import { useState } from 'react'
import { Paper, Typography, Chip, Button, Checkbox, FormControlLabel, MenuItem, Select } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type {
  GridColDef,
  GridRowSelectionModel,
} from '@mui/x-data-grid'

import type { PdfResponse } from '../services/importacionesService'
import type { MovimientoExtraido } from '../types/MovimientoExtraido'
import { CATEGORIAS } from '../constants/categorias'
import CheckIcon from '@mui/icons-material/Check'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import { formatoFecha, formatoMoneda } from '../constants/formatos'
import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material'

import {
  confirmarImportacion as guardarImportacion,
} from '../services/importacionesService'

interface Props {
  resultado: PdfResponse
  onGuardando: (guardando: boolean) => void
  onImportado: (completo: boolean) => void
}

type MovimientoFila = MovimientoExtraido & {
  id: number
}

const columnasBase: GridColDef<MovimientoFila>[] = [
  { field: 'fechaCargo', headerName: 'Fecha', width: 135, valueFormatter: formatoFecha },
  { field: 'comercio', headerName: 'Comercio', flex: 1, minWidth: 145 },
  { field: 'monto', headerName: 'Monto', type: 'number', width: 125, sortComparator: compararMontos, valueFormatter: formatoMoneda },
]

export default function ImportacionPreview({
  resultado, onGuardando, onImportado,
}: Props) {
    const [guardando, setGuardando] = useState(false)
const [error, setError] = useState<string | null>(null)
const [exito, setExito] = useState<string | null>(null)

const [duplicados, setDuplicados] =
  useState<MovimientoExtraido[]>([])

const [dialogAbierto, setDialogAbierto] = useState(false)

  // Movimientos extraídos
  const [rows, setRows] = useState<MovimientoFila[]>(() =>
    resultado.movimientos.map((movimiento, index) => ({
      ...movimiento,
      id: index + 1,
    }))
  )

  // Movimientos seleccionados
  const [selection, setSelection] =
    useState<GridRowSelectionModel>(() => ({
      type: 'include',
      ids: new Set(rows.map((row) => row.id)),
    }))

  const movimientosSeleccionados = rows.filter((row) =>
    selection.type === 'include'
      ? selection.ids.has(row.id)
      : !selection.ids.has(row.id)
  )

  // Total de los movimientos seleccionados
  const totalSeleccionado = sumarMontos(movimientosSeleccionados.map(({ monto }) => monto))

  const columns: GridColDef<MovimientoFila>[] = [
    ...columnasBase,
    {
      field: 'categoria', headerName: 'Categoría', flex: 1, minWidth: 185,
      renderCell: ({ row, tabIndex }) => (
        <Select
          fullWidth size="small" value={row.categoria} disabled={guardando}
          inputProps={{ 'aria-label': `Categoría de ${row.comercio}`, tabIndex }}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            const categoria = event.target.value
            setRows((lista) => lista.map((movimiento) => movimiento.id === row.id ? { ...movimiento, categoria } : movimiento))
          }}
        >
          {!CATEGORIAS.includes(row.categoria) && <MenuItem value={row.categoria}>{row.categoria}</MenuItem>}
          {CATEGORIAS.map((categoria) => <MenuItem key={categoria} value={categoria}>{categoria}</MenuItem>)}
        </Select>
      ),
    },
  ]

  // Preparar movimientos para la importación
  async function confirmarImportacion(
  permitirCoincidencias = false
) {
  if (guardando || !movimientosSeleccionados.length) return
  setGuardando(true)
  onGuardando(true)
  setError(null)
  setExito(null)
  setDialogAbierto(false)

  try {
    const movimientos = movimientosSeleccionados.map(
      ({ id, ...movimiento }) => {
        void id
        return movimiento
      }
    )

    const respuesta = await guardarImportacion(
      movimientos,
      permitirCoincidencias
    )

    if (
      respuesta.posiblesDuplicados.length > 0 &&
      !permitirCoincidencias
    ) {
      setDuplicados(respuesta.posiblesDuplicados)
      setDialogAbierto(true)
      return
    }

    setExito(
      `Se importaron correctamente ${respuesta.importados} movimientos.`
    )

    setRows((anteriores) =>
      anteriores.filter(
        (row) =>
          !movimientosSeleccionados.some(
            (seleccionado) => seleccionado.id === row.id
          )
      )
    )

    setSelection({
      type: 'include',
      ids: new Set(),
    })

    setDuplicados([])
    onImportado(movimientosSeleccionados.length === rows.length)

  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Error inesperado'
    )
  } finally {
    setGuardando(false)
    onGuardando(false)
  }
}

  return (
    
    <section className="panel grid min-w-0 gap-4 p-4 sm:p-5" aria-labelledby="vista-previa-importacion">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography component="h2" variant="h6" id="vista-previa-importacion" className="flex items-center gap-2">
          <FormatListBulletedIcon /> Vista previa de movimientos extraídos
        </Typography>
        <Chip size="small" color="success" label={`${resultado.totalMovimientos} movimientos encontrados`} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700">
        <span className="break-all"><strong>Archivo</strong> {resultado.nombreArchivo}</span>
        <span><strong>Banco</strong> {resultado.movimientos[0]?.banco ?? 'Desconocido'}</span>
      </div>

      <DataGrid
        className="data-table"
        aria-label="Movimientos extraídos"
        autoHeight
        rowHeight={50}
        localeText={{ noRowsLabel: 'No hay movimientos pendientes', paginationRowsPerPage: 'Filas por página' }}
        loading={guardando}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        disableRowSelectionExcludeModel
        rowSelectionModel={selection}
        onRowSelectionModelChange={(modelo) => { if (!guardando) setSelection(modelo) }}
        pageSizeOptions={[5, 10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dbe3ef] pt-3">
        <FormControlLabel className="ml-0" label={`Seleccionar todos (${rows.length})`}
          control={<Checkbox disabled={guardando || !rows.length}
            checked={rows.length > 0 && movimientosSeleccionados.length === rows.length}
            indeterminate={movimientosSeleccionados.length > 0 && movimientosSeleccionados.length < rows.length}
            onChange={(_, checked) => setSelection({ type: 'include', ids: new Set(checked ? rows.map(({ id }) => id) : []) })} />} />
        <div className="flex flex-wrap items-center gap-4">
          <Typography>Total <strong className="ml-1 tabular-nums">{formatoMoneda(totalSeleccionado)}</strong></Typography>
          <Button variant="contained" color="success" disabled={!movimientosSeleccionados.length || guardando}
            onClick={() => confirmarImportacion()}
            startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}>
            {guardando ? 'Guardando…' : 'Guardar importación'}
          </Button>
        </div>
      </div>
{error && (
  <Alert severity="error">
    {error}
  </Alert>
)}

{exito && (
  <Alert severity="success">
    {exito}
  </Alert>
)}
<Dialog
  open={dialogAbierto}
  onClose={() => setDialogAbierto(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    Posibles movimientos duplicados
  </DialogTitle>

  <DialogContent>
    <Alert severity="warning" className="mb-4">
      Encontramos {duplicados.length} movimientos
      que podrían estar registrados anteriormente.
      Todavía no se ha guardado ningún movimiento.
    </Alert>

    <div className="flex flex-col gap-3">
      {duplicados.map((movimiento, index) => (
        <Paper
          key={index}
          variant="outlined"
          className="p-3"
        >
          <div className="flex justify-between gap-3">
            <div>
              <Typography sx={{ fontWeight: 600 }}>
                {movimiento.comercio}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {movimiento.fechaCargo} · {movimiento.banco}
              </Typography>
            </div>

            <Typography sx={{ fontWeight: 600 }}>
              {formatoMoneda(movimiento.monto)}
            </Typography>
          </div>
        </Paper>
      ))}
    </div>
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => setDialogAbierto(false)}
    >
      Revisar movimientos
    </Button>

    <Button
      color="warning"
      variant="contained"
      onClick={() => confirmarImportacion(true)}
    >
      Importar de todos modos
    </Button>
  </DialogActions>
</Dialog>
    </section>
    
  )
}