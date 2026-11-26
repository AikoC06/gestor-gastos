import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined'
import ExpenseSection from '../components/ExpenseSection'

export default function GastosHormiga() {
  return (
    <ExpenseSection
      title="Gastos hormiga"
      description="Compras pequeñas del día a día."
      emptyTitle="Seguimiento de gastos hormiga pendiente"
      message="Puedes revisar tus compras pequeñas en el historial de movimientos."
      icon={<CoffeeOutlinedIcon />}
    />
  )
}
