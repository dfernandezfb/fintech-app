import { Transaction } from '../../../domain/entities/Transaction'
import { CreateTransactionParams } from '../output/ITransactionRepository'

export interface ICreateTransactionUseCase {
  execute(params: CreateTransactionParams): Promise<Transaction>
}

export interface IListTransactionsUseCase {
  execute(userId: string): Promise<Transaction[]>
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
