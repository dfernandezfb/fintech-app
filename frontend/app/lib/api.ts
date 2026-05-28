const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'

export interface User {
  id:        string
  name:      string
  email:     string
  balance:   number
  createdAt: string
}

export interface Transaction {
  id:              string
  fromUserId:      string
  toUserId:        string
  amount:          number
  status:          'pending' | 'confirmed' | 'rejected'
  rejectionReason?: string
  createdAt:       string
}

export interface CreateTransactionDto {
  fromUserId: string
  toUserId:   string
  amount:     number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const ERROR_LABELS: Record<string, string> = {
  INSUFFICIENT_BALANCE:      "El remitente no tiene suficiente saldo para esta transacción.",
  USER_NOT_FOUND:            'Uno de los usuarios seleccionados no pudo ser encontrado.',
  SAME_USER_TRANSACTION:     'El remitente y el destinatario deben ser usuarios diferentes.',
  INVALID_AMOUNT:            'Por favor, ingrese un monto válido mayor que 0.',
  TRANSACTION_NOT_FOUND:     'Transacción no encontrada.',
  TRANSACTION_NOT_PENDING:   'Esta transacción ya no está pendiente.',
}

export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    return ERROR_LABELS[err.code] ?? err.message
  }
  return 'An unexpected error occurred. Please try again.'
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...(options?.body != null && { headers: { 'Content-Type': 'application/json' } }),
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.message ?? 'Request failed', body.error ?? 'UNKNOWN', res.status)
  }
  return res.json() as Promise<T>
}

export const api = {
  getUsers: () =>
    request<User[]>('/users'),

  getTransactions: (userId: string) =>
    request<Transaction[]>(`/transactions?userId=${userId}`),

  getPendingTransactions: () =>
    request<Transaction[]>('/transactions/pending'),

  createTransaction: (data: CreateTransactionDto) =>
    request<Transaction>('/transactions', {
      method: 'POST',
      body:   JSON.stringify(data),
    }),

  approveTransaction: (id: string) =>
    request<Transaction>(`/transactions/${id}/approve`, { method: 'PATCH' }),

  rejectTransaction: (id: string, reason?: string) =>
    request<Transaction>(`/transactions/${id}/reject`, {
      method: 'PATCH',
      body:   JSON.stringify({ reason }),
    }),
}
