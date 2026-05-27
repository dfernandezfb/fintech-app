import { Transaction } from '../../../domain/entities/Transaction'

export interface CreateTransactionParams {
  fromUserId: string
  toUserId: string
  amount: number
}

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>
  findByUserId(userId: string): Promise<Transaction[]>
  createAndConfirm(params: CreateTransactionParams): Promise<Transaction>
  createPending(params: CreateTransactionParams): Promise<Transaction>
  approve(transactionId: string): Promise<Transaction>
  reject(transactionId: string, reason?: string): Promise<Transaction>
}
