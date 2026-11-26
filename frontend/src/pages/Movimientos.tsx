import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid'
import { esES } from '@mui/x-data-grid/locales'
import type { GridColDef, GridPaginationModel, GridRowSelectionModel, GridSortModel } from '@mui/x-data-grid'
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  InputAdornment, Snackbar, TextField, Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'

import type { Gasto } from '../types/Gasto'
import type { CrearGastoRequest } from '../types/CrearGastoRequest'
import { actualizarGasto, consultarGastos, crearGasto, eliminarGasto, eliminarGastos } from '../services/gastosService'
import type { ConsultaGastos, PaginaGastos } from '../services/gastosService'
import CategoryChip from '../components/CategoryChip'
import FiltrosMovimientos from '../components/FiltrosMovimientos'
import { filtrosIniciales, origenes, tarjetas } from '../constants/movimientos'
import GastoForm from '../components/GastoForm'
import PageHeader from '../components/PageHeader'
import { formatoFecha, formatoMoneda } from '../constants/formatos'

const ordenInicial: GridSortModel = [{ field: 'fechaCargo', sort: 'desc' }]
const sinSeleccion: GridRowSelectionModel = { type: 'include', ids: new Set() }
const filasVacias: Gasto[] = []

type Respuesta = {
  consulta: ConsultaGastos
  revision: number
  resultado?: PaginaGastos
  error?: string
}

type Confirmacion = { gasto: Gasto } | { ids: number[] }

function mensajeError(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado'
}

const columnasBase: GridColDef<Gasto>[] = [
  { field: 'fechaCargo', headerName: 'Fecha', minWidth: 130, valueFormatter: formatoFecha },
  { field: 'comercio', headerName: 'Comercio', flex: 1, minWidth: 160,
    renderCell: ({ value }) => <span className="font-semibold">{value}</span> },
  { field: 'categoria', sortable: false, headerName: 'Categoría', flex: 1, minWidth: 170,
    renderCell: ({ row }) => <CategoryChip categoria={row.categoria} /> },
  { field: 'banco', sortable: false, headerName: 'Banco', flex: 0.65, minWidth: 100,
    valueFormatter: (value: string | null) => value || '—' },
  { field: 'tipoTarjeta', sortable: false, headerName: 'Tarjeta', flex: 1, minWidth: 180,
    renderCell: ({ row }) => (
      <span className="inline-flex items-center gap-2">
        <CreditCardOutlinedIcon fontSize="small" color="primary" />
        {tarjetas[row.tipoTarjeta]} {row.ultimosDigitos && `•••• ${row.ultimosDigitos}`}
      </span>
    ) },
  { field: 'monto', headerName: 'Monto', type: 'number', minWidth: 110,
    valueFormatter: formatoMoneda },
  { field: 'origen', sortable: false, headerName: 'Origen', minWidth: 148,
    renderCell: ({ row }) => <Chip size="small" label={origenes[row.origen]} className={
      row.origen === 'MANUAL' ? 'bg-blue-100 font-semibold text-blue-800' : 'bg-green-100 font-semibold text-green-800'
    } /> },
]

export default function Movimientos() {
  const [entrada, setEntrada] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [paginacion, setPaginacion] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [orden, setOrden] = useState<GridSortModel>(ordenInicial)
  const [seleccion, setSeleccion] = useState(sinSeleccion)
  const [revision, setRevision] = useState(0)
  const [respuesta, setRespuesta] = useState<Respuesta>()
  const [formulario, setFormulario] = useState<{ gasto?: Gasto }>()
  const [confirmacion, setConfirmacion] = useState<Confirmacion>()
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const valor = entrada.trim()
    if (valor === busqueda) return
    const temporizador = window.setTimeout(() => {
      setBusqueda(valor)
      setPaginacion(actual => actual.page ? { ...actual, page: 0 } : actual)
      setSeleccion(sinSeleccion)
    }, 350)
    return () => window.clearTimeout(temporizador)
  }, [entrada, busqueda])

  const campoOrden = orden[0]?.field
  const direccion = orden[0]?.sort ?? 'desc'
  const consulta = useMemo<ConsultaGastos>(() => ({
    ...filtros,
    comercio: busqueda,
    pagina: paginacion.page,
    tamanoPagina: paginacion.pageSize,
    ordenarPor: campoOrden === 'monto' || campoOrden === 'comercio' ? campoOrden : 'fecha',
    direccion,
  }), [filtros, busqueda, paginacion.page, paginacion.pageSize, campoOrden, direccion])

  const cargando = respuesta?.consulta !== consulta || respuesta.revision !== revision
  const resultado = respuesta?.resultado
  const error = cargando ? undefined : respuesta?.error

  useEffect(() => {
    const controlador = new AbortController()
    consultarGastos(consulta, controlador.signal)
      .then(datos => {
        if (controlador.signal.aborted) return
        const ultimaPagina = Math.max(0, Math.ceil(datos.totalRegistros / paginacion.pageSize) - 1)
        if (paginacion.page > ultimaPagina) {
          setPaginacion(actual => ({ ...actual, page: ultimaPagina }))
          return
        }
        setRespuesta({ consulta, revision, resultado: datos })
      })
      .catch(error => {
        if (controlador.signal.aborted) return
        setRespuesta(anterior => ({ consulta, revision, resultado: anterior?.resultado, error: mensajeError(error) }))
      })
    return () => controlador.abort()
  }, [consulta, paginacion.page, paginacion.pageSize, revision])

  function aplicarFiltros(nuevos: typeof filtrosIniciales, comercio = entrada.trim()) {
    setFiltros(actual => Object.keys(actual).every(clave =>
      actual[clave as keyof typeof actual] === nuevos[clave as keyof typeof actual]) ? actual : nuevos)
    setBusqueda(comercio)
    setPaginacion(actual => actual.page ? { ...actual, page: 0 } : actual)
    setSeleccion(sinSeleccion)
    setFiltrosAbiertos(false)
  }

  async function guardarMovimiento(gasto: CrearGastoRequest) {
    if (formulario?.gasto) {
      await actualizarGasto(formulario.gasto.id, gasto)
      setMensaje('Movimiento actualizado correctamente')
    } else {
      await crearGasto(gasto)
      setMensaje('Movimiento registrado correctamente')
    }
    setRevision(actual => actual + 1)
  }

  const abrirConfirmacion = useCallback((objetivo: Confirmacion) => {
    setErrorEliminar('')
    setConfirmacion(objetivo)
  }, [])

  async function confirmarEliminacion() {
    if (!confirmacion || eliminando) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      if ('gasto' in confirmacion) {
        await eliminarGasto(confirmacion.gasto.id)
        const id = confirmacion.gasto.id
        setSeleccion(actual => ({ type: 'include', ids: new Set([...actual.ids].filter(seleccionado => seleccionado !== id)) }))
        setMensaje('Movimiento eliminado correctamente')
      } else {
        const { eliminados } = await eliminarGastos(confirmacion.ids)
        setSeleccion(sinSeleccion)
        setMensaje(eliminados === 1 ? 'Se eliminó 1 movimiento' : `Se eliminaron ${eliminados} movimientos`)
      }
      setConfirmacion(undefined)
      setRevision(actual => actual + 1)
    } catch (error) {
      setErrorEliminar(mensajeError(error))
    } finally {
      setEliminando(false)
    }
  }

  const columnas = useMemo<GridColDef<Gasto>[]>(() => [
    ...columnasBase,
    {
      field: 'acciones', type: 'actions', headerName: 'Acciones', width: 85, sortable: false,
      getActions: ({ row }) => [
        <GridActionsCellItem key="editar" icon={<EditOutlinedIcon />} label="Editar" showInMenu
          onClick={() => setFormulario({ gasto: row })} />,
        <GridActionsCellItem key="eliminar" icon={<DeleteOutlineIcon />} label="Eliminar" showInMenu
          onClick={() => abrirConfirmacion({ gasto: row })} />,
      ],
    },
  ], [abrirConfirmacion])

  const filtrosActivos = Object.values(filtros).filter(Boolean).length + Number(Boolean(busqueda))
  const seleccionados = seleccion.ids.size
  const totalRegistros = resultado?.totalRegistros ?? 0
  const resumen = totalRegistros === 1 ? '1 movimiento encontrado' : `${totalRegistros} movimientos encontrados`

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader title="Movimientos" description="Consulta y administra tus gastos"
        action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormulario({})}>Nuevo movimiento</Button>} />

      <section aria-label="Filtros de movimientos" className="flex flex-wrap items-center gap-3">
        <TextField placeholder="Buscar por comercio" size="small" className="min-w-52 flex-1 bg-white" value={entrada}
          onChange={event => setEntrada(event.target.value)}
          slotProps={{ htmlInput: { 'aria-label': 'Buscar por comercio', maxLength: 255 },
            input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
        <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setFiltrosAbiertos(true)}>Filtros</Button>
        <Button startIcon={<RestartAltIcon />} disabled={!filtrosActivos && !entrada}
          onClick={() => { setEntrada(''); aplicarFiltros(filtrosIniciales, '') }}>Limpiar filtros</Button>
        {filtrosActivos > 0 && <Chip label={filtrosActivos === 1 ? '1 filtro activo' : `${filtrosActivos} filtros activos`} />}
      </section>

      {error && <Alert severity="error" action={<Button color="inherit" onClick={() => setRevision(actual => actual + 1)}>Reintentar</Button>}>{error}</Alert>}

      <div className="panel flex flex-wrap items-center justify-between gap-2 px-4 py-3" aria-live="polite" aria-busy={cargando}>
        <Typography className="font-semibold">{cargando || error ? '—' : resumen}</Typography>
        <Typography>Total filtrado <strong className="ml-2 tabular-nums">{cargando || error ? '—' : formatoMoneda(resultado?.montoTotal ?? '0')}</strong></Typography>
        {seleccionados > 0 && (
          <Button color="error" startIcon={<DeleteOutlineIcon />} disabled={cargando || Boolean(error)}
            onClick={() => abrirConfirmacion({ ids: [...seleccion.ids].map(Number) })}>Eliminar seleccionados ({seleccionados})</Button>
        )}
      </div>

      <section className="panel min-w-0 overflow-hidden" aria-label="Historial de gastos">
        <DataGrid className="data-table"
          localeText={{ ...esES.components.MuiDataGrid.defaultProps.localeText,
            noRowsLabel: error ? 'Historial no disponible' : filtrosActivos ? 'Ningún movimiento coincide con los filtros' : 'Aún no hay gastos registrados',
            paginationRowsPerPage: 'Filas por página', actionsCellMore: 'Más acciones' }}
          rows={cargando || error ? filasVacias : resultado?.movimientos ?? filasVacias}
          rowCount={totalRegistros}
          rowHeight={49}
          columns={columnas}
          loading={cargando}
          autoHeight
          checkboxSelection
          disableRowSelectionOnClick
          disableRowSelectionExcludeModel
          keepNonExistentRowsSelected
          rowSelectionModel={seleccion}
          onRowSelectionModelChange={setSeleccion}
          disableColumnFilter
          paginationMode="server"
          paginationModel={paginacion}
          onPaginationModelChange={setPaginacion}
          sortingMode="server"
          sortingOrder={['asc', 'desc']}
          sortModel={orden}
          onSortModelChange={modelo => {
            setOrden(modelo.length ? modelo : ordenInicial)
            setPaginacion(actual => ({ ...actual, page: 0 }))
          }}
          pageSizeOptions={[5, 10, 25]}
          sx={{ border: 0 }}
        />
      </section>

      {filtrosAbiertos && <FiltrosMovimientos filtros={filtros} onAplicar={aplicarFiltros} onCerrar={() => setFiltrosAbiertos(false)} />}
      {formulario && <GastoForm open gasto={formulario.gasto} onClose={() => setFormulario(undefined)} onSubmit={guardarMovimiento} />}

      <Dialog open={Boolean(confirmacion)} onClose={() => { if (!eliminando) setConfirmacion(undefined) }}
        aria-labelledby="confirmar-eliminacion-titulo">
        <DialogTitle id="confirmar-eliminacion-titulo">Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmacion && ('gasto' in confirmacion
              ? `¿Eliminar el movimiento de ${confirmacion.gasto.comercio}?`
              : `¿Eliminar los ${confirmacion.ids.length} movimientos seleccionados?`)}
          </DialogContentText>
          {errorEliminar && <Alert className="mt-3" severity="error">{errorEliminar}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button disabled={eliminando} onClick={() => setConfirmacion(undefined)}>Cancelar</Button>
          <Button disabled={eliminando} color="error" variant="contained" onClick={confirmarEliminacion}>
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(mensaje)} autoHideDuration={4500} onClose={() => setMensaje('')}>
        <Alert severity="success" onClose={() => setMensaje('')}>{mensaje}</Alert>
      </Snackbar>
    </div>
  )
}
