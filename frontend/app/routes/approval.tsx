import { useEffect, useState } from 'react'
import { useLoaderData, useRevalidator, useFetcher } from 'react-router'
import { ValidationError } from 'yup'
import type { Route } from './+types/approval'
import { api, friendlyError, type Transaction, type User } from '~/lib/api'
import { rejectTransactionSchema, extractFieldErrors, type FieldErrors } from '~/lib/validations'
import { formatAmount, formatDate, truncateId } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Skeleton } from '~/components/ui/skeleton'

export type ApprovalActionData =
  | { ok: true;  txId: string }
  | { ok: false; txId?: string; error?: string; fieldErrors?: FieldErrors }

export async function loader() {
  try {
    const [transactions, users] = await Promise.all([
      api.getPendingTransactions(),
      api.getUsers(),
    ])
    return { transactions, users, loadError: null }
  } catch (err) {
    return { transactions: [] as Transaction[], users: [] as User[], loadError: friendlyError(err) }
  }
}

export async function action({ request }: Route.ActionArgs): Promise<ApprovalActionData> {
  try {
    const formData = await request.formData()
    const intent   = formData.get('intent') as string
    const txId     = formData.get('txId')   as string

    if (intent === 'approve') {
      await api.approveTransaction(txId)
      return { ok: true, txId }
    }

    if (intent === 'reject') {
      const raw         = { reason: (formData.get('reason') as string) ?? '' }
      const { reason }  = await rejectTransactionSchema.validate(raw, { abortEarly: false })
      await api.rejectTransaction(txId, reason || undefined)
      return { ok: true, txId }
    }

    return { ok: false, error: 'Unknown action.' }
  } catch (err) {
    if (err instanceof ValidationError) {
      return { ok: false, fieldErrors: extractFieldErrors(err) }
    }
    return { ok: false, error: friendlyError(err) }
  }
}

export function HydrateFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de Aprobación</h1>
        <p className="text-muted-foreground">Revisar transacciones pendientes</p>
      </div>
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-medium text-destructive">Error al cargar los datos</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No se pudo conectar con el servidor. Por favor, recargue la página.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Recargar
        </Button>
      </div>
    </div>
  )
}

function TransactionRow({
  tx,
  usersMap,
}: {
  tx:       Transaction
  usersMap: Map<string, User>
}) {
  const fetcher         = useFetcher<ApprovalActionData>()
  const [open, setOpen] = useState(false)

  const isProcessing = fetcher.state !== 'idle'
  const isDone       = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (fetcher.data?.ok === true) setOpen(false)
  }, [fetcher.data])

  if (isDone) return null

  const actionError =
    fetcher.data?.ok === false ? fetcher.data.error : undefined
  const fieldErrors =
    fetcher.data?.ok === false ? fetcher.data.fieldErrors : undefined

  const userName = (id: string) => usersMap.get(id)?.name ?? truncateId(id)

  return (
    <tr className="border-b bg-amber-50 last:border-0 hover:bg-amber-100/60">
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
        {truncateId(tx.id)}
      </td>
      <td className="px-4 py-3 font-medium">{userName(tx.fromUserId)}</td>
      <td className="px-4 py-3">{userName(tx.toUserId)}</td>
      <td className="px-4 py-3 text-right font-mono font-semibold">
        {formatAmount(tx.amount)}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <fetcher.Form method="post" action="/aprobaciones">
            <input type="hidden" name="intent" value="approve" />
            <input type="hidden" name="txId"   value={tx.id} />
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={isProcessing}
            >
              {isProcessing && fetcher.formData?.get('intent') === 'approve'
                ? 'Aprobando...'
                : 'Aprobar'}
            </Button>
          </fetcher.Form>

          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            disabled={isProcessing}
            onClick={() => setOpen(true)}
          >
            Rechazar
          </Button>

          {actionError && (
            <span className="text-xs text-destructive">{actionError}</span>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar Transacción</DialogTitle>
              <DialogDescription>
                Opcionalmente, proporcione un motivo. No se moverán fondos.
              </DialogDescription>
            </DialogHeader>

            <fetcher.Form
              method="post"
              action="/aprobaciones"
            >
              <input type="hidden" name="intent" value="reject" />
              <input type="hidden" name="txId"   value={tx.id} />

              <div className="space-y-2">
                <Label htmlFor={`reason-${tx.id}`}>Motivo (opcional)</Label>
                <Textarea
                  id={`reason-${tx.id}`}
                  name="reason"
                  placeholder="Ej. Excede el límite diario, actividad sospechosa…"
                  rows={3}
                />
                {fieldErrors?.reason && (
                  <p className="text-xs text-destructive">{fieldErrors.reason}</p>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive">
                  Confirmar Rechazo
                </Button>
              </DialogFooter>
            </fetcher.Form>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  )
}

export default function Approval() {
  const { transactions, users, loadError } = useLoaderData<typeof loader>()
  const { revalidate, state }              = useRevalidator()

  const usersMap     = new Map(users.map((u) => [u.id, u]))
  const isRefreshing = state === 'loading'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel de Aprobación</h1>
          <p className="text-muted-foreground">Revisar transacciones pendientes</p>
        </div>
        <Button variant="outline" size="sm" onClick={revalidate} disabled={isRefreshing}>
          {isRefreshing ? 'Recargando...' : '↻ Recargar'}
        </Button>
      </div>

      {loadError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {!loadError && (
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
            transactions.length === 0
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {transactions.length === 0
              ? '✓ No hay transacciones pendientes'
              : `${transactions.length} transacción${transactions.length > 1 ? 'es' : ''} esperando revisión`}
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transacciones Pendientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl">🎉</p>
              <p className="mt-2 font-medium">Todo limpio</p>
              <p className="text-sm text-muted-foreground">No hay transacciones pendientes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Origen</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Destino</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Monto</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} usersMap={usersMap} />
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
