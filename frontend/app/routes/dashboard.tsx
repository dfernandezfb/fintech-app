import { useEffect, useRef, useState } from 'react'
import { redirect, useLoaderData, useNavigation, useNavigate } from 'react-router'
import type { Route } from './+types/dashboard'
import { api } from '~/lib/api'
import { formatAmount, formatDate } from '~/lib/utils'
import { TransactionStatusBadge } from '~/components/TransactionStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')

  const users = await api.getUsers()

  if (!userId && users.length > 0) {
    throw redirect(`/dashboard?userId=${users[0].id}`)
  }

  const transactions = userId ? await api.getTransactions(userId) : []

  return { users, transactions, selectedUserId: userId }
}

export function HydrateFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function TruncatedReason({ reason }: { reason: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [clipped, setClipped] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (el) setClipped(el.scrollWidth > el.offsetWidth)
  }, [reason])

  const label = (
    <span
      ref={ref}
      className="block max-w-[160px] truncate text-xs text-muted-foreground"
    >
      {reason}
    </span>
  )

  if (!clipped) return label

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{label}</TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function Dashboard() {
  const { users, transactions, selectedUserId } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const navigate   = useNavigate()

  const isLoading = navigation.state === 'loading'

  const [statusFilter, setStatusFilter] = useState<'confirmed' | 'pending' | 'rejected' | null>(null)

  const usersMap = new Map(users.map((u) => [u.id, u]))
  const userName = (id: string) => usersMap.get(id)?.name ?? id.slice(0, 8) + '…'

  const counts = {
    total:     transactions.length,
    confirmed: transactions.filter((t) => t.status === 'confirmed').length,
    pending:   transactions.filter((t) => t.status === 'pending').length,
    rejected:  transactions.filter((t) => t.status === 'rejected').length,
  }

  const filteredTransactions = statusFilter
    ? transactions.filter((t) => t.status === statusFilter)
    : transactions

  const toggleFilter = (status: 'confirmed' | 'pending' | 'rejected') => {
    setStatusFilter((prev) => (prev === status ? null : status))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Ver historial de transacciones para cualquier usuario</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Ver transacciones de:</label>
            <Select
              value={selectedUserId ?? ''}
              onValueChange={(id) => navigate(`/dashboard?userId=${id}`)}
            >
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} — {formatAmount(u.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!isLoading && transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total',       value: counts.total,     color: '',                 filter: null                  },
            { label: 'Confirmadas', value: counts.confirmed, color: 'text-emerald-600', filter: 'confirmed' as const  },
            { label: 'Pendientes',  value: counts.pending,   color: 'text-amber-600',   filter: 'pending'   as const  },
            { label: 'Rechazadas',  value: counts.rejected,  color: 'text-red-600',     filter: 'rejected'  as const  },
          ].map(({ label, value, color, filter }) => {
            const isActive    = statusFilter === filter
            const isClickable = filter !== null
            return (
              <Card
                key={label}
                onClick={() => isClickable && toggleFilter(filter)}
                className={[
                  isClickable ? 'cursor-pointer select-none transition-all' : '',
                  isActive
                    ? 'ring-2 ring-offset-1 shadow-md ' +
                      (filter === 'confirmed' ? 'ring-emerald-500' :
                       filter === 'pending'   ? 'ring-amber-500'   :
                                               'ring-red-500')
                    : isClickable ? 'hover:shadow-sm hover:border-muted-foreground/30' : '',
                ].join(' ')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                    {isActive && label !== 'Total' && (
                      <span className="ml-1.5 text-xs font-normal opacity-60">· click para limpiar</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Transacciones
            {statusFilter && (
              <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${
                statusFilter === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                statusFilter === 'pending'   ? 'bg-amber-100 text-amber-700'     :
                                              'bg-red-100 text-red-700'
              }`}>
                {statusFilter === 'confirmed' ? 'Confirmadas' :
                 statusFilter === 'pending'   ? 'Pendientes'  : 'Rechazadas'}
              </span>
            )}
          </CardTitle>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Limpiar filtro
            </button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {statusFilter
                ? `No hay transacciones ${
                    statusFilter === 'confirmed' ? 'confirmadas' :
                    statusFilter === 'pending'   ? 'pendientes'  : 'rechazadas'
                  } para este usuario.`
                : 'No hay transacciones para este usuario.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Origen</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Destino</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Monto</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Razón</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`border-b last:border-0 transition-colors ${
                        tx.status === 'pending'
                          ? 'bg-amber-50 hover:bg-amber-100/60'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{userName(tx.fromUserId)}</td>
                      <td className="px-4 py-3">{userName(tx.toUserId)}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <TransactionStatusBadge status={tx.status} />
                      </td>
                      <td className="px-4 py-3">
                        {tx.status === 'rejected' && tx.rejectionReason
                          ? <TruncatedReason reason={tx.rejectionReason} />
                          : <span className="text-xs text-muted-foreground/40">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
