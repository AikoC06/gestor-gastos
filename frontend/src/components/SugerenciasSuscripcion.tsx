import { Alert, Button, Skeleton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { formatoFecha, formatoMoneda } from '../constants/formatos'
import { frecuencias } from '../constants/suscripciones'
import { tarjetas } from '../constants/movimientos'
import type { SugerenciaSuscripcion } from '../types/Suscripcion'

const confianza = { ALTA: 'Confianza alta', MEDIA: 'Confianza media', BAJA: 'Confianza baja' }

export default function SugerenciasSuscripcion({
  sugerencias, cargando, ocupado, error, onAnalizar, onConfirmar, onDescartar,
}: {
  sugerencias: SugerenciaSuscripcion[]
  cargando: boolean
  ocupado: boolean
  error?: string
  onAnalizar: () => void
  onConfirmar: (sugerencia: SugerenciaSuscripcion) => void
  onDescartar: (sugerencia: SugerenciaSuscripcion) => void
}) {
  return (
    <section id="panel-detectadas" role="tabpanel" aria-labelledby="tab-detectadas" aria-busy={cargando} className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Sugerencias de suscripción</h2>
        <Button variant="outlined" startIcon={<SearchIcon />} onClick={onAnalizar} disabled={cargando || ocupado}
          className="rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
          Analizar movimientos
        </Button>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {cargando && <Skeleton variant="rounded" height={140} />}
      {!cargando && !error && sugerencias.length === 0 && <p className="panel p-6 text-slate-600">No hay sugerencias pendientes de revisión.</p>}
      {!cargando && sugerencias.map(sugerencia => (
        <article key={sugerencia.id} className="panel grid gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-700 text-lg font-bold text-white">
              {sugerencia.nombre.slice(0, 1).toLocaleUpperCase('es-MX')}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-lg font-bold">{sugerencia.nombre}</h3>
              <p className="text-sm text-slate-600">{sugerencia.frecuenciaEstimada ? `${frecuencias[sugerencia.frecuenciaEstimada]} estimada` : 'Frecuencia por confirmar'}</p>
            </div>
            <div className="text-right">
              <p className="font-bold tabular-nums">{formatoMoneda(sugerencia.montoEstimado)} <span className="text-xs font-normal text-slate-600">estimado</span></p>
              <p className="text-sm text-slate-600">{confianza[sugerencia.confianza]}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <span>Último cobro {formatoFecha(sugerencia.ultimoCobro)}</span>
            <span>{sugerencia.proximoCobroEstimado ? `Próximo estimado ${formatoFecha(sugerencia.proximoCobroEstimado)}` : 'Próximo cobro por confirmar'}</span>
            <span>{[sugerencia.banco, tarjetas[sugerencia.tipoTarjeta], sugerencia.ultimosDigitos && `•••• ${sugerencia.ultimosDigitos}`].filter(Boolean).join(' · ')}</span>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {sugerencia.motivos.map(motivo => <li key={motivo}>{motivo}</li>)}
          </ul>
          <details className="text-sm">
            <summary className="w-fit cursor-pointer font-semibold text-blue-700">
              {sugerencia.cantidadMovimientos === 1 ? 'Ver 1 movimiento asociado' : `Ver ${sugerencia.cantidadMovimientos} movimientos asociados`}
            </summary>
            <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 px-3">
              {sugerencia.movimientos.map(movimiento => (
                <li key={movimiento.id} className="flex flex-wrap justify-between gap-x-3 py-2">
                  <span>{movimiento.comercio}</span>
                  <span className="tabular-nums">{formatoFecha(movimiento.fechaCargo)} · {formatoMoneda(movimiento.monto)}</span>
                </li>
              ))}
            </ul>
          </details>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outlined" disabled={ocupado} onClick={() => onDescartar(sugerencia)}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-100 disabled:opacity-50">Descartar</Button>
            <Button variant="contained" disabled={ocupado} onClick={() => onConfirmar(sugerencia)}
              className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">Confirmar suscripción</Button>
          </div>
        </article>
      ))}
    </section>
  )
}
