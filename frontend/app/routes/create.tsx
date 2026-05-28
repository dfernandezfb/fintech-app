import { useState } from 'react'
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from 'react-router'
import { ValidationError } from 'yup'
import type { Route } from './+types/create'
import { api, friendlyError, type Transaction, type User } from '~/lib/api'
import {
  createTransactionSchema,
  extractFieldErrors,
  type FieldErrors,
} from '~/lib/validations'
import { formatAmount } from '~/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'

const LARGE_TX_THRESHOLD = 50_000

type ActionData =
  | { ok: true; transaction: Transaction }
  | { ok: false; fieldErrors?: FieldErrors; error?: string }

export async function loader(): Promise<{ users: User[] }> {
  const users = await api.getUsers()
  return { users }
}

export async function action({ request }: Route.ActionArgs): Promise<ActionData> {
  const formData = await request.formData()

  const raw = {
    fromUserId: formData.get('fromUserId') as string,
    toUserId:   formData.get('toUserId')   as string,
    amount:     Number(formData.get('amount')),
  }

  try {
    const data = await createTransactionSchema.validate(raw, { abortEarly: false })
    const transaction = await api.createTransaction({
      fromUserId: data.fromUserId as string,
      toUserId:   data.toUserId   as string,
      amount:     data.amount     as number,
    })
    return { ok: true, transaction }
  } catch (err) {
    if (err instanceof ValidationError) {
      return { ok: false, fieldErrors: extractFieldErrors(err) }
    }
    return { ok: false, error: friendlyError(err) }
  }
}

export function HydrateFallback() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function CreateTransaction() {
  const { users }    = useLoaderData<typeof loader>()
  const actionData   = useActionData<typeof action>() as ActionData | undefined
  const navigation   = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [fromUserId, setFromUserId] = useState(users[0]?.id ?? '')
  const [toUserId,   setToUserId]   = useState(users[1]?.id ?? '')

  const fieldErrors = actionData?.ok === false ? actionData.fieldErrors : undefined
  const apiError    = actionData?.ok === false ? actionData.error        : undefined
  const result      = actionData?.ok === true  ? actionData.transaction  : undefined

  const usersMap    = new Map(users.map((u) => [u.id, u]))

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva Transacción</h1>
        <p className="text-muted-foreground">Transferir fondos entre usuarios</p>
      </div>

      {!result && (
        <Card>
          <CardContent className="pt-6">
            <Form method="post" className="space-y-5">

              <input type="hidden" name="fromUserId" value={fromUserId} />
              <input type="hidden" name="toUserId"   value={toUserId} />

              <div className="space-y-1.5">
                <Label>Desde</Label>
                <Select value={fromUserId} onValueChange={setFromUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sender" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} disabled={u.id === toUserId}>
                        {u.name} — {formatAmount(u.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors?.fromUserId && (
                  <p className="text-xs text-destructive">{fieldErrors.fromUserId}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Para</Label>
                <Select value={toUserId} onValueChange={setToUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select receiver" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} disabled={u.id === fromUserId}>
                        {u.name} — {formatAmount(u.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors?.toUserId && (
                  <p className="text-xs text-destructive">{fieldErrors.toUserId}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount">Monto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
                {fieldErrors?.amount && (
                  <p className="text-xs text-destructive">{fieldErrors.amount}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Cantidades por encima de {formatAmount(LARGE_TX_THRESHOLD)} requieren aprobación manual.
                </p>
              </div>

              {apiError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">Transacción fallida</p>
                  <p className="mt-0.5 opacity-80">{apiError}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  'Enviar Transacción'
                )}
              </Button>
            </Form>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className={
          result.status === 'confirmed'
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'
        }>
          <CardHeader className="pb-2">
            <CardTitle className={`text-base ${
              result.status === 'confirmed' ? 'text-emerald-800' : 'text-amber-800'
            }`}>
              {result.status === 'confirmed' ? '✅ Transacción Confirmada' : '⏳ Revisión Pendiente'}
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-4 text-sm ${
            result.status === 'confirmed' ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {result.status === 'confirmed' ? (
              <p>
                Se transfirieron {formatAmount(result.amount)} de{' '}
                <strong>{usersMap.get(result.fromUserId)?.name}</strong> a{' '}
                <strong>{usersMap.get(result.toUserId)?.name}</strong>.
              </p>
            ) : (
              <p>
                La transacción de {formatAmount(result.amount)} excede el umbral de confirmación automática
                y requiere aprobación manual. Sigue su estado en el{' '}
                <Link to="/approval" className="font-medium underline underline-offset-2">
                  Panel de Aprobaciones
                </Link>.
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/create">Nueva Transacción</Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/dashboard">Ver Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
