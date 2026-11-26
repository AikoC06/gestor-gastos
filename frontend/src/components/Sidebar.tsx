import { List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import RepeatIcon from '@mui/icons-material/Repeat'
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import { NavLink, useLocation } from 'react-router-dom'

const menu = [
  { label: 'Resumen', path: '/', icon: HomeOutlinedIcon },
  { label: 'Movimientos', path: '/movimientos', icon: FormatListBulletedIcon },
  { label: 'Importar estados', path: '/importaciones', icon: UploadFileOutlinedIcon },
  { label: 'Suscripciones', path: '/suscripciones', icon: RepeatIcon },
  { label: 'Gastos hormiga', path: '/gastos-hormiga', icon: CoffeeOutlinedIcon },
]

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="border-b border-[#dbe3ef] bg-[#f9fbff] lg:border-r lg:border-b-0 lg:sticky lg:top-0 lg:h-dvh">
      <div className="flex items-center gap-3 border-b border-[#dbe3ef] px-4 py-4 sm:px-5 lg:mb-4 lg:py-5">
        <span className="grid size-10 place-items-center rounded-xl bg-[#0756e8] text-white">
          <AccountBalanceWalletOutlinedIcon fontSize="small" />
        </span>
        <Typography variant="h6" component="div">Gestor de Gastos</Typography>
      </div>
      <nav aria-label="Principal" className="overflow-x-auto">
        <List className="flex min-w-max gap-1 px-3 pt-0 pb-3 lg:block lg:min-w-0">
          {menu.map(({ label, path, icon: Icon }) => (
            <ListItemButton
              key={path}
              component={NavLink}
              to={path}
              end
              selected={pathname === path}
              className="gap-2 rounded-xl whitespace-nowrap lg:mb-1"
              sx={{
                color: '#283952',
                '&:hover': { backgroundColor: '#ecf3ff' },
                '&.Mui-selected, &.Mui-selected:hover': {
                  backgroundColor: '#dceafe',
                  color: '#0746b8',
                },
                '&.Mui-focusVisible': { outline: '2px solid #0756e8', outlineOffset: '-2px' },
              }}
            >
              <ListItemIcon className="min-w-0 text-inherit"><Icon fontSize="small" /></ListItemIcon>
              <ListItemText primary={label} slotProps={{ primary: { variant: 'body2', className: 'font-semibold' } }} />
            </ListItemButton>
          ))}
        </List>
      </nav>
    </aside>
  )
}
