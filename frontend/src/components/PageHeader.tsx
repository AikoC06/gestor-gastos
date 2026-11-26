import type { ReactNode } from 'react'
import { Typography } from '@mui/material'

export default function PageHeader({ title, description, action }: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <Typography component="h1" variant="h4" className="text-[clamp(1.75rem,4vw,2.5rem)]">
          {title}
        </Typography>
        <Typography color="text.secondary" className="mt-2">{description}</Typography>
      </div>
      {action}
    </header>
  )
}
