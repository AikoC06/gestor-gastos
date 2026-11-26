import type { ReactNode } from 'react'
import { Button, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link } from 'react-router-dom'
import PageHeader from './PageHeader'

export default function ExpenseSection({ title, description, emptyTitle, message, icon }: {
  title: string
  description: string
  emptyTitle: string
  message: string
  icon: ReactNode
}) {
  return (
    <div className="grid gap-6">
      <PageHeader title={title} description={description} />
      <section className="panel flex flex-col items-center px-5 py-12 text-center sm:py-16">
        <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-[#e1edff] text-[#0746b8]">{icon}</span>
        <Typography variant="h6" component="h2">{emptyTitle}</Typography>
        <Typography color="text.secondary" className="mt-2 mb-5 max-w-sm">{message}</Typography>
        <Button component={Link} to="/movimientos" variant="outlined" endIcon={<ArrowForwardIcon />}>
          Ir a movimientos
        </Button>
      </section>
    </div>
  )
}
