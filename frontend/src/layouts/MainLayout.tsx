import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function MainLayout() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <Sidebar />
      <main className="mx-auto w-full max-w-[100rem] min-w-0 px-4 py-6 sm:px-8 lg:p-7">
        <Outlet />
      </main>
    </div>
  )
}
