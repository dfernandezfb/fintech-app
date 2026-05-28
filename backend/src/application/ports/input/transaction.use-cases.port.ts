import { Transaction } from '../../../domain/entities/Transaction'
import { PaginatedResult, PaginationParams } from '../output/ITransactionRepository'
import { CreateTransactionParams } from '../output/ITransactionRepository'

export interface ICreateTransactionUseCase {
  execute(params: CreateTransactionParams): Promise<Transaction>
}

export interface IListTransactionsUseCase {
  execute(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Transaction>>
}

export interface IApproveTransactionUseCase {
  execute(transactionId: string): Promise<Transaction>
}

export interface IRejectTransactionUseCase {
  execute(transactionId: string, reason?: string): Promise<Transaction>
}

export interface IListPendingTransactionsUseCase {
  execute(): Promise<Transaction[]>
}
