import { Chip } from '@mui/material'
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined'
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'

const estilos = {
  Alimentación: { icon: RestaurantOutlinedIcon, background: '#fff0d9', color: '#8a430c' },
  Transporte: { icon: DirectionsCarOutlinedIcon, background: '#e0edff', color: '#104bb4' },
  Compras: { icon: ShoppingCartOutlinedIcon, background: '#f0e9ff', color: '#5725a4' },
  Supermercado: { icon: ShoppingCartOutlinedIcon, background: '#ddf7e3', color: '#14622f' },
  Suscripciones: { icon: PlayCircleOutlinedIcon, background: '#fce5ee', color: '#96214d' },
  Entretenimiento: { icon: PlayCircleOutlinedIcon, background: '#eee8ff', color: '#5326a2' },
}

export default function CategoryChip({ categoria }: { categoria: string }) {
  const { icon: Icon, background, color } = estilos[categoria as keyof typeof estilos] ??
    { icon: SellOutlinedIcon, background: '#edf1f7', color: '#354761' }

  return <Chip size="small" label={categoria} icon={<Icon />} sx={{
    backgroundColor: background, color, fontWeight: 600, '& .MuiChip-icon': { color },
  }} />
}
