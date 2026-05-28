import { Transaction } from '../../../domain/entities/Transaction'

export interface CreateTransactionParams {
  fromUserId: string
  toUserId: string
  amount: number
}

export interface PaginationParams {
  page:    number
  limit:   number
  status?: 'confirmed' | 'pending' | 'rejected'
}

export interface StatusCounts {
  confirmed: number
  pending:   number
  rejected:  number
}

export interface PaginatedResult<T> {
  data:         T[]
  total:        number
  page:         number
  limit:        number
  totalPages:   number
  statusCounts: StatusCounts
}

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>
  findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Transaction>>
  findAllPending(): Promise<Transaction[]>
  createAndConfirm(params: CreateTransactionParams): Promise<Transaction>
  createPending(params: CreateTransactionParams): Promise<Transaction>
  approve(transactionId: string): Promise<Transaction>
  reject(transactionId: string, reason?: string): Promise<Transaction>
}
