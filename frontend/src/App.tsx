import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Movimientos from './pages/Movimientos'
import Suscripciones from './pages/Suscripciones'
import GastosHormiga from './pages/GastosHormiga'
import Importaciones from './pages/Importaciones'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="movimientos" element={<Movimientos />} />
          <Route path="suscripciones" element={<Suscripciones />} />
          <Route path="gastos-hormiga" element={<GastosHormiga />} />
          <Route path="importaciones" element={<Importaciones />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}