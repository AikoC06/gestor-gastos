import { useState } from 'react'
import { Alert, Button, Chip, CircularProgress, Typography } from '@mui/material'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PageHeader from '../components/PageHeader'
import ImportacionPreview from '../components/ImportacionPreview'
import { importarPdf } from '../services/importacionesService'
import type { PdfResponse } from '../services/importacionesService'

interface ArchivoCargado {
  id: number
  nombre: string
  banco?: string | null
  estado: 'Procesando' | 'Por revisar' | 'Importado' | 'Importado parcialmente' | 'Error'
}

export default function Importaciones() {
  const [archivos, setArchivos] = useState<ArchivoCargado[]>([])
  const [resultado, setResultado] = useState<{ id: number; datos: PdfResponse } | null>(null)
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ocupado = loading || guardando

  function actualizarArchivo(id: number, cambios: Partial<ArchivoCargado>) {
    setArchivos((lista) => lista.map((archivo) => archivo.id === id ? { ...archivo, ...cambios } : archivo))
  }

  async function procesarArchivo(archivo: File) {
    if (ocupado) return
    if (!archivo.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecciona un archivo PDF.')
      return
    }
    if (archivo.size > 10 * 1024 * 1024) {
      setError('El archivo supera los 10 MB.')
      return
    }

    const id = (archivos[0]?.id ?? 0) + 1
    setArchivos((lista) => [{ id, nombre: archivo.name, estado: 'Procesando' }, ...lista])
    setLoading(true)
    setError(null)
    setResultado(null)

    try {
      const datos = await importarPdf(archivo)
      setResultado({ id, datos })
      actualizarArchivo(id, { estado: 'Por revisar', banco: datos.movimientos[0]?.banco })
    } catch (error) {
      actualizarArchivo(id, { estado: 'Error' })
      setError(error instanceof Error ? error.message : 'No se pudo procesar el archivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 sm:size-15">
          <UploadFileOutlinedIcon fontSize="large" />
        </span>
        <PageHeader title="Importar estado de cuenta"
          description="Extrae automáticamente tus movimientos desde un estado de cuenta en PDF" />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <section className="panel p-4" aria-label="Subir estado de cuenta en PDF">
          <div
            className={`flex min-h-60 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[#83afff] px-4 py-6 text-center ${arrastrando ? 'bg-blue-100' : 'bg-[#eff6ff]'}`}
            aria-busy={ocupado}
            onDragOver={(event) => {
              event.preventDefault()
              if (!ocupado) setArrastrando(true)
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(event) => {
              event.preventDefault()
              setArrastrando(false)
              const archivo = event.dataTransfer.files[0]
              if (archivo) void procesarArchivo(archivo)
            }}
          >
            <PictureAsPdfOutlinedIcon color="primary" sx={{ fontSize: 60 }} />
            <Typography className="font-semibold">Arrastra tu PDF aquí o selecciona un archivo</Typography>
            <Button component="label" variant="contained" disabled={ocupado}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <UploadFileOutlinedIcon />}
              sx={{ '&:focus-within': { outline: '2px solid #0756e8', outlineOffset: 3 } }}>
              {loading ? 'Procesando…' : 'Seleccionar PDF'}
              <input className="sr-only" type="file" aria-label="Seleccionar PDF" accept=".pdf,application/pdf" disabled={ocupado}
                onChange={(event) => {
                  const archivo = event.target.files?.[0]
                  event.target.value = ''
                  if (archivo) void procesarArchivo(archivo)
                }} />
            </Button>
            <Typography variant="body2" color="text.secondary">Solo archivos PDF · Máximo 10 MB</Typography>
          </div>
        </section>

        <section className="panel min-w-0 overflow-hidden" aria-labelledby="archivos-cargados">
          <Typography id="archivos-cargados" variant="h6" component="h2" className="flex items-center gap-3 border-b border-[#dbe3ef] px-5 py-4">
            <DescriptionOutlinedIcon fontSize="small" /> Archivos cargados
          </Typography>
          {archivos.length ? (
            <ul className="max-h-60 divide-y divide-[#dbe3ef] overflow-y-auto" aria-live="polite">
              {archivos.map(({ id, nombre, banco, estado }) => (
                <li key={id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <PictureAsPdfOutlinedIcon color="error" />
                  <div className="min-w-0 flex-1">
                    <Typography variant="body2" className="font-semibold break-all">{nombre}</Typography>
                    {banco && <Typography variant="body2" color="text.secondary">{banco}</Typography>}
                  </div>
                  <Chip size="small" label={estado}
                    color={estado === 'Importado' ? 'success' : estado === 'Error' ? 'error' : 'primary'} variant="outlined" />
                </li>
              ))}
            </ul>
          ) : <Typography variant="body2" color="text.secondary" className="p-5">Los PDF cargados durante esta visita aparecerán aquí.</Typography>}
        </section>
      </div>

      {error && <Alert severity="error">{error}</Alert>}
      {resultado && <ImportacionPreview key={resultado.id} resultado={resultado.datos}
        onGuardando={setGuardando}
        onImportado={(completo) => actualizarArchivo(resultado.id, { estado: completo ? 'Importado' : 'Importado parcialmente' })} />}
    </div>
  )
}
