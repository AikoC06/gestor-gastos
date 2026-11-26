import { useEffect, useState } from 'react'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem,
  Skeleton, Snackbar, Tab, Tabs, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RepeatIcon from '@mui/icons-material/Repeat'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { formatoFecha, formatoMoneda } from '../constants/formatos'
import { estadosSuscripcion, frecuencias } from '../constants/suscripciones'
import PageHeader from '../components/PageHeader'
import SuscripcionForm from '../components/SuscripcionForm'
import SugerenciasSuscripcion from '../components/SugerenciasSuscripcion'
import { confirmarSugerencia, consultarSugerencias, descartarSugerencia, eliminarSuscripcion, guardarSuscripcion, listarSuscripciones, obtenerResumenSuscripciones } from '../services/suscripcionesService'
import type { EstadoSuscripcion, GuardarSuscripcionRequest, ResumenSuscripciones, SugerenciaSuscripcion, Suscripcion } from '../types/Suscripcion'

const filtros = [
  ['TODAS', 'Todas'], ['ACTIVA', 'Activas'], ['PAUSADA', 'Pausadas'], ['CANCELADA', 'Canceladas'],
] as const

const estilosEstado = {
  ACTIVA: 'bg-green-100 text-green-800',
  PAUSADA: 'bg-amber-100 text-amber-900',
  CANCELADA: 'bg-slate-100 text-slate-700',
}
const colores = ['bg-blue-700', 'bg-teal-700', 'bg-indigo-700', 'bg-rose-700']
const botonPrimario = 'rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800'

type Resultado = {
  revision: number
  suscripciones?: Suscripcion[]
  resumen?: ResumenSuscripciones
  error?: string
}

function mensajeError(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado'
}

export default function Suscripciones() {
  const [pestana, setPestana] = useState<'mis' | 'detectadas'>('mis')
  const [analisis, setAnalisis] = useState({ revision: 0, explicito: false })
  const [deteccion, setDeteccion] = useState<{ revision: number; sugerencias: SugerenciaSuscripcion[]; error?: string }>()
  const [filtro, setFiltro] = useState<EstadoSuscripcion | 'TODAS'>('TODAS')
  const [revision, setRevision] = useState(0)
  const [resultado, setResultado] = useState<Resultado>()
  const [formulario, setFormulario] = useState<{ suscripcion?: Suscripcion; sugerencia?: SugerenciaSuscripcion }>()
  const [menu, setMenu] = useState<{ ancla: HTMLElement; suscripcion: Suscripcion }>()
  const [porEliminar, setPorEliminar] = useState<Suscripcion>()
  const [ocupado, setOcupado] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')
  const [aviso, setAviso] = useState<{ texto: string; tipo: 'success' | 'error' }>()

  const cargando = resultado?.revision !== revision
  const error = cargando ? undefined : resultado?.error
  const analizando = deteccion?.revision !== analisis.revision
  const resumen = resultado?.resumen
  const visibles = resultado?.suscripciones?.filter(suscripcion => filtro === 'TODAS' || suscripcion.estado === filtro) ?? []

  useEffect(() => {
    const controlador = new AbortController()
    Promise.all([listarSuscripciones(controlador.signal), obtenerResumenSuscripciones(controlador.signal)])
      .then(([suscripciones, resumen]) => {
        if (!controlador.signal.aborted) setResultado({ revision, suscripciones, resumen })
      })
      .catch(error => {
        if (!controlador.signal.aborted) setResultado({ revision, error: mensajeError(error) })
      })
    return () => controlador.abort()
  }, [revision])

  useEffect(() => {
    const controlador = new AbortController()
    consultarSugerencias(controlador.signal, analisis.explicito)
      .then(sugerencias => {
        if (!controlador.signal.aborted) setDeteccion({ revision: analisis.revision, sugerencias })
      })
      .catch(error => {
        if (!controlador.signal.aborted) setDeteccion({ revision: analisis.revision, sugerencias: [], error: mensajeError(error) })
      })
    return () => controlador.abort()
  }, [analisis])

  function solicitarAnalisis(explicito = false) {
    setAnalisis(anterior => ({ revision: anterior.revision + 1, explicito }))
  }

  async function descartar(sugerencia: SugerenciaSuscripcion) {
    setOcupado(true)
    try {
      await descartarSugerencia(sugerencia.id)
      setAviso({ texto: 'Sugerencia descartada', tipo: 'success' })
    } catch (error) {
      setAviso({ texto: mensajeError(error), tipo: 'error' })
    } finally {
      solicitarAnalisis()
      setOcupado(false)
    }
  }

  function actualizarVista(texto: string) {
    setAviso({ texto, tipo: 'success' })
    setRevision(actual => actual + 1)
    solicitarAnalisis()
  }

  async function guardar(datos: GuardarSuscripcionRequest) {
    if (formulario?.sugerencia) {
      await confirmarSugerencia(formulario.sugerencia, datos)
      actualizarVista('Suscripción confirmada')
      return
    }
    const id = formulario?.suscripcion?.id
    await guardarSuscripcion(datos, id)
    actualizarVista(id === undefined ? 'Suscripción registrada' : 'Suscripción actualizada')
  }

  async function cambiarEstado(suscripcion: Suscripcion, estado: EstadoSuscripcion) {
    setMenu(undefined)
    setOcupado(true)
    const { nombre, comercio, monto, categoria, frecuencia, fechaInicio, proximoCobro, banco, tipoTarjeta, ultimosDigitos } = suscripcion
    try {
      await guardarSuscripcion({ nombre, comercio, monto, categoria, frecuencia, fechaInicio, proximoCobro, banco, tipoTarjeta, ultimosDigitos, estado }, suscripcion.id)
      const mensajes = { ACTIVA: 'Suscripción reactivada', PAUSADA: 'Suscripción pausada', CANCELADA: 'Suscripción cancelada' }
      actualizarVista(mensajes[estado])
    } catch (error) {
      setAviso({ texto: mensajeError(error), tipo: 'error' })
    } finally {
      setOcupado(false)
    }
  }

  async function confirmarEliminar() {
    if (!porEliminar || ocupado) return
    setOcupado(true)
    setErrorEliminar('')
    try {
      await eliminarSuscripcion(porEliminar.id)
      setPorEliminar(undefined)
      actualizarVista('Suscripción eliminada')
    } catch (error) {
      setErrorEliminar(mensajeError(error))
    } finally {
      setOcupado(false)
    }
  }

  const indicadores = [
    { etiqueta: 'Activas', valor: resumen?.activas, icono: RepeatIcon },
    { etiqueta: 'Costo mensual estimado', valor: resumen && formatoMoneda(resumen.costoMensual), icono: AccountBalanceWalletOutlinedIcon },
    { etiqueta: 'Costo anual estimado', valor: resumen && formatoMoneda(resumen.costoAnual), icono: CalendarTodayOutlinedIcon },
  ]

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader title="Suscripciones" description="Identifica y administra tus pagos recurrentes"
        action={<Button variant="contained" className={botonPrimario} startIcon={<AddIcon />}
          onClick={() => setFormulario({})}>Nueva suscripción</Button>} />

      <Tabs value={pestana} onChange={(_, valor: 'mis' | 'detectadas') => {
        setPestana(valor)
        if (valor === 'detectadas') solicitarAnalisis()
      }} aria-label="Vistas de suscripciones" variant="scrollable" className="border-b border-slate-200">
        <Tab value="mis" id="tab-mis" aria-controls="panel-mis" className="px-4 py-3 font-semibold" label="Mis suscripciones" />
        <Tab value="detectadas" id="tab-detectadas" aria-controls="panel-detectadas" className="px-4 py-3 font-semibold"
          label={deteccion && !deteccion.error ? `Detectadas automáticamente (${deteccion.sugerencias.length})` : 'Detectadas automáticamente'} />
      </Tabs>

      {pestana === 'detectadas' && <SugerenciasSuscripcion
        sugerencias={deteccion?.sugerencias ?? []} cargando={analizando}
        ocupado={ocupado} error={analizando ? undefined : deteccion?.error} onAnalizar={() => solicitarAnalisis(true)}
        onConfirmar={sugerencia => setFormulario({ sugerencia })} onDescartar={descartar} />}

      {pestana === 'mis' && <div id="panel-mis" role="tabpanel" aria-labelledby="tab-mis" className="grid gap-6">
        {error && <Alert severity="error" action={<Button onClick={() => setRevision(actual => actual + 1)}>Reintentar</Button>}>{error}</Alert>}

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de suscripciones" aria-busy={cargando}>
          {indicadores.map(({ etiqueta, valor, icono: Icon }) => (
            <div key={etiqueta} className="panel grid content-start gap-2 p-4 sm:p-5">
              <Icon className="text-blue-700" fontSize="small" />
              <Typography color="text.secondary">{etiqueta}</Typography>
              {cargando ? <Skeleton width={110} height={34} /> :
                <Typography component="p" className="text-2xl font-bold tabular-nums">{error ? '—' : valor}</Typography>}
            </div>
          ))}
        </section>

        <section className="grid min-w-0 gap-3" aria-labelledby="mis-suscripciones" aria-busy={cargando}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography id="mis-suscripciones" component="h2" className="text-xl font-bold">Mis suscripciones</Typography>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por estado">
              {filtros.map(([valor, etiqueta]) => (
                <Button key={valor} size="small" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}
                  className={`min-h-9 rounded-lg px-3 text-sm font-semibold ${filtro === valor ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {etiqueta}
                </Button>
              ))}
            </div>
          </div>

          {cargando ? <Skeleton variant="rounded" height={90} /> : !error && (
            visibles.length === 0 ? (
              <Typography className="panel p-6 text-slate-600">
                {filtro === 'TODAS' ? 'Aún no has registrado suscripciones.' : 'No hay suscripciones con este estado.'}
              </Typography>
            ) : (
              <ul className="grid gap-3">
                {visibles.map(suscripcion => (
                  <li key={suscripcion.id} className="panel flex flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:gap-4 sm:px-5">
                    <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-xl text-lg font-bold text-white sm:size-12 ${colores[suscripcion.id % colores.length]}`}>
                      {suscripcion.nombre.slice(0, 1).toLocaleUpperCase('es-MX')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Typography component="h3" className="break-words text-lg font-bold">{suscripcion.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">{suscripcion.categoria} · {frecuencias[suscripcion.frecuencia]}</Typography>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estilosEstado[suscripcion.estado]}`}>
                      {estadosSuscripcion[suscripcion.estado]}
                    </span>
                    <div className="min-w-28 text-right">
                      <Typography className="font-bold tabular-nums">{formatoMoneda(suscripcion.monto)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {suscripcion.proximoCobro ? `Próximo: ${formatoFecha(suscripcion.proximoCobro)}` : 'Sin próximo cobro'}
                      </Typography>
                    </div>
                    <IconButton aria-label={`Acciones de ${suscripcion.nombre}`} aria-haspopup="menu"
                      disabled={ocupado} onClick={e => setMenu({ ancla: e.currentTarget, suscripcion })}>
                      <MoreVertIcon />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )
          )}
        </section>

      </div>}

      <Menu anchorEl={menu?.ancla} open={Boolean(menu)} onClose={() => setMenu(undefined)}>
        <MenuItem onClick={() => { if (menu) setFormulario({ suscripcion: menu.suscripcion }); setMenu(undefined) }}>Editar</MenuItem>
        {menu?.suscripcion.estado === 'ACTIVA' && <MenuItem onClick={() => cambiarEstado(menu.suscripcion, 'PAUSADA')}>Pausar</MenuItem>}
        {menu && menu.suscripcion.estado !== 'ACTIVA' && <MenuItem onClick={() => cambiarEstado(menu.suscripcion, 'ACTIVA')}>Reactivar</MenuItem>}
        {menu && menu.suscripcion.estado !== 'CANCELADA' && <MenuItem onClick={() => cambiarEstado(menu.suscripcion, 'CANCELADA')}>Cancelar suscripción</MenuItem>}
        <MenuItem className="text-red-700" onClick={() => { setErrorEliminar(''); setPorEliminar(menu?.suscripcion); setMenu(undefined) }}>Eliminar</MenuItem>
      </Menu>

      {formulario && <SuscripcionForm suscripcion={formulario.suscripcion} sugerencia={formulario.sugerencia} onCerrar={() => setFormulario(undefined)} onGuardar={guardar} />}

      <Dialog open={Boolean(porEliminar)} onClose={ocupado ? undefined : () => setPorEliminar(undefined)} aria-labelledby="eliminar-suscripcion-titulo">
        <DialogTitle id="eliminar-suscripcion-titulo" className="px-5 pt-5 pb-3 text-lg font-bold">Eliminar suscripción</DialogTitle>
        <DialogContent className="grid gap-3 px-5 pb-3">
          <Typography>¿Eliminar {porEliminar?.nombre}? Los movimientos históricos se conservarán.</Typography>
          {errorEliminar && <Alert severity="error">{errorEliminar}</Alert>}
        </DialogContent>
        <DialogActions className="gap-2 px-5 py-4">
          <Button className="rounded-lg px-4 py-2 hover:bg-slate-100" disabled={ocupado} onClick={() => setPorEliminar(undefined)}>Cancelar</Button>
          <Button className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
            color="error" variant="contained" disabled={ocupado} onClick={confirmarEliminar}>
            {ocupado ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={4500} onClose={() => setAviso(undefined)}>
        <Alert severity={aviso?.tipo} onClose={() => setAviso(undefined)}>{aviso?.texto}</Alert>
      </Snackbar>
    </div>
  )
}
