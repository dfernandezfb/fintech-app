import type { Transaction } from '~/lib/api'

const styles: Record<Transaction['status'], string> = {
  confirmed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  pending:   'bg-amber-100  text-amber-800  border border-amber-200',
  rejected:  'bg-red-100    text-red-800    border border-red-200',
}

const labels: Record<Transaction['status'], string> = {
  confirmed: 'Confirmada',
  pending:   'Pendiente',
  rejected:  'Rechazada',
}

export function TransactionStatusBadge({ status }: { status: Transaction['status'] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
