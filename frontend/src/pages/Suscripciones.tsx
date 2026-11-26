import RepeatIcon from '@mui/icons-material/Repeat'
import ExpenseSection from '../components/ExpenseSection'

export default function Suscripciones() {
  return (
    <ExpenseSection
      title="Suscripciones"
      description="Pagos recurrentes y servicios contratados."
      emptyTitle="Seguimiento de suscripciones pendiente"
      message="Puedes consultar tus cargos recurrentes en el historial de movimientos."
      icon={<RepeatIcon />}
    />
  )
}
