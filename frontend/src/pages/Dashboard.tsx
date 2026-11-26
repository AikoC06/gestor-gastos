import type Decimal from 'decimal.js'
import { Monto, sumarMontos } from '../constants/montos'
import { useEffect, useState } from 'react'
import { Alert, Button, MenuItem, Skeleton, TextField, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import CategoryChip from '../components/CategoryChip'
import { formatoFecha, formatoMoneda, nombreMes, periodoActual } from '../constants/formatos'
import { obtenerGastos } from '../services/gastosService'
import type { Gasto } from '../types/Gasto'

function mesesHasta(periodo: string, cantidad: number) {
  const [year, month] = periodo.split('-').map(Number)
  return Array.from({ length: cantidad }, (_, i) =>
    new Date(Date.UTC(year, month - cantidad + i, 1)).toISOString().slice(0, 7))
}

const dineroEje = new Intl.NumberFormat('es-MX', { notation: 'compact', style: 'currency', currency: 'MXN' })
const mesCorto = new Intl.DateTimeFormat('es-MX', { month: 'short', year: '2-digit', timeZone: 'UTC' })

export default function Dashboard() {
  const [gastos, setGastos] = useState<Gasto[] | null>(null)
  const [error, setError] = useState(false)
  const [periodo, setPeriodo] = useState(periodoActual)
  const [rango, setRango] = useState(6)

  useEffect(() => {
    const controlador = new AbortController()
    obtenerGastos(controlador.signal)
      .then((datos) => { if (!controlador.signal.aborted) setGastos(datos) })
      .catch(() => { if (!controlador.signal.aborted) setError(true) })
    return () => controlador.abort()
  }, [])

  const periodos = [...new Set([periodoActual(), periodo, ...(gastos?.map(({ fechaCargo }) => fechaCargo.slice(0, 7)) ?? [])])].sort().reverse()
  const meses = mesesHasta(periodo, rango)
  const delMes = gastos?.filter(({ fechaCargo }) => fechaCargo.startsWith(periodo)) ?? []
  const delMesAnterior = meses.at(-2)
  const cero = new Monto(0)
  const totales = new Map<string, Decimal>()
  for (const gasto of gastos ?? []) {
    const mes = gasto.fechaCargo.slice(0, 7)
    totales.set(mes, (totales.get(mes) ?? cero).plus(gasto.monto))
  }

  const total = totales.get(periodo) ?? cero
  const anterior = totales.get(delMesAnterior ?? '') ?? cero
  const variacion = anterior.isZero() ? null : new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(total.minus(anterior).div(anterior).toFixed() as `${number}`)
  const porCategoria = new Map<string, Decimal>()
  for (const { categoria, monto } of delMes) {
    porCategoria.set(categoria, (porCategoria.get(categoria) ?? cero).plus(monto))
  }
  const categorias = [...porCategoria].sort((a, b) => b[1].cmp(a[1]))
  const destacadas = categorias.length > 6
    ? [...categorias.slice(0, 5), ['Resto', sumarMontos(categorias.slice(5).map(([, monto]) => monto))] as const]
    : categorias
  const recientes = delMes.sort((a, b) => b.fechaCargo.localeCompare(a.fechaCargo) || b.id - a.id).slice(0, 5)
  const indicadores = [
    { label: 'Gastos del mes', value: formatoMoneda(total), detail: variacion ? `${variacion} vs. mes anterior` : nombreMes(periodo), icon: CreditCardOutlinedIcon },
    { label: 'Suscripciones', value: formatoMoneda(porCategoria.get('Suscripciones') ?? cero), detail: 'Cargos de la categoría', icon: CalendarMonthOutlinedIcon },
    { label: 'Gastos hormiga', value: '—', detail: 'Sin criterio de clasificación', icon: CoffeeOutlinedIcon },
    { label: 'Movimientos', value: delMes.length, detail: 'Registrados en el mes', icon: SwapHorizIcon },
  ]

  return (
    <div className="grid min-w-0 gap-5">
      <PageHeader title="Dashboard financiero" description="Resumen de tus finanzas, gastos y hábitos de consumo"
        action={<TextField id="dashboard-periodo" label="Mes" size="small" select className="min-w-44 bg-white" value={periodo}
          onChange={(event) => setPeriodo(event.target.value)}>
          {periodos.map((mes) => <MenuItem key={mes} value={mes}>{nombreMes(mes)}</MenuItem>)}
        </TextField>} />
      {error ? <Alert severity="error">No se pudieron cargar tus gastos.</Alert> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={gastos === null}>
            {indicadores.map(({ label, value, detail, icon: Icon }, index) => (
              <div key={label} className="panel flex min-w-0 gap-3 p-4 sm:p-5">
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${index % 2 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  <Icon />
                </span>
                <div className="min-w-0 flex-1">
                  <Typography variant="body2" className="font-semibold">{label}</Typography>
                  {gastos ? <>
                    <Typography variant="h5" component="p" className="my-1 break-words tabular-nums">{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{detail}</Typography>
                  </> : <Skeleton width="75%" />}
                </div>
              </div>
            ))}
          </div>
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <section className="panel min-w-0 p-4 sm:p-5">
              <Typography variant="h6" component="h2">Gastos por categoría</Typography>
              <Typography variant="body2" color="text.secondary">Distribución de tus gastos en el mes</Typography>
              {!gastos ? <Skeleton variant="rounded" height={240} className="mt-4" /> : destacadas.length ? (
                <BarChart height={258} grid={{ horizontal: true }} borderRadius={6}
                  margin={{ bottom: 55 }}
                  xAxis={[{ scaleType: 'band', data: destacadas.map(([nombre]) => nombre),
                    valueFormatter: (nombre, { location }) => location === 'tick' && nombre.length > 11 ? nombre.slice(0, 10) + '…' : nombre,
                    colorMap: { type: 'ordinal', colors: ['#0756e8', '#39ae68', '#56aff3', '#75ce9b', '#86bfff', '#a4b6cd'] } }]}
                  yAxis={[{ valueFormatter: (valor: number) => dineroEje.format(valor) }]}
                  series={[{ data: destacadas.map(([, monto]) => monto.toNumber()), valueFormatter: (valor, { dataIndex }) => valor == null ? '—' : formatoMoneda(destacadas[dataIndex][1]) }]} />
              ) : <Typography color="text.secondary" className="py-16 text-center">Aún no hay gastos en este mes.</Typography>}
            </section>
            <section className="panel min-w-0 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Typography variant="h6" component="h2">Evolución de gastos</Typography>
                  <Typography variant="body2" color="text.secondary">Total de gastos por periodo</Typography>
                </div>
                <TextField id="dashboard-rango" label="Rango" size="small" select value={rango} onChange={(event) => setRango(Number(event.target.value))}>
                  {[3, 6, 12].map((cantidad) => <MenuItem key={cantidad} value={cantidad}>Últimos {cantidad} meses</MenuItem>)}
                </TextField>
              </div>
              {!gastos ? <Skeleton variant="rounded" height={240} className="mt-4" /> : (
                <LineChart height={258} grid={{ horizontal: true }}
                  xAxis={[{ scaleType: 'point', data: meses.map((mes) => mesCorto.format(new Date(mes + '-01T00:00:00Z'))) }]}
                  yAxis={[{ valueFormatter: (valor: number) => dineroEje.format(valor) }]}
                  series={[{ data: meses.map((mes) => (totales.get(mes) ?? cero).toNumber()), area: true, curve: 'linear', color: '#0756e8',
                    valueFormatter: (valor, { dataIndex }) => valor == null ? '—' : formatoMoneda(totales.get(meses[dataIndex]) ?? cero) }]}
                  sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.13 } }} />
              )}
            </section>
          </div>
          <div className="grid min-w-0 gap-4 xl:grid-cols-[1.35fr_1fr]">
            <section className="panel min-w-0 overflow-hidden" aria-busy={gastos === null}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dbe3ef] px-5 py-3">
                <Typography variant="h6" component="h2">Movimientos recientes</Typography>
                <Button component={Link} to="/movimientos" endIcon={<ArrowForwardIcon />}>Ver todos</Button>
              </div>
              {!gastos ? <div className="p-5"><Skeleton /><Skeleton /></div> : !recientes.length ? (
                <Typography color="text.secondary" className="p-5">Aquí aparecerán los movimientos del mes.</Typography>
              ) : (
                <ul className="divide-y divide-[#dbe3ef]">
                  {recientes.map((gasto) => (
                    <li key={gasto.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                      <span className="min-w-0 flex-1 font-semibold break-words">{gasto.comercio}</span>
                      <CategoryChip categoria={gasto.categoria} />
                      <span className="font-semibold tabular-nums text-green-800">{formatoMoneda(gasto.monto)}</span>
                      <Typography variant="body2" color="text.secondary">{formatoFecha(gasto.fechaCargo)}</Typography>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="panel p-3">
              <div className="h-full rounded-xl bg-[#eaf8ef] p-5">
                <Typography variant="h6" component="h2" className="flex items-center gap-2">
                  <TrendingUpIcon color="success" /> Resumen del mes
                </Typography>
                {!gastos ? <Skeleton className="mt-4" /> : delMes.length ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm marker:text-green-700">
                    <li>{delMes.length} movimientos en {categorias.length} categorías.</li>
                    <li>Mayor gasto en {categorias[0][0]} ({formatoMoneda(categorias[0][1])}).</li>
                    {variacion && <li>Variación respecto al mes anterior {variacion}.</li>}
                  </ul>
                ) : <Typography variant="body2" className="mt-4">Sin movimientos registrados en el periodo.</Typography>}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
