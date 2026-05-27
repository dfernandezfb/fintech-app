import { Transaction } from '../../domain/entities/Transaction'
import {
  TransactionNotFoundError,
  TransactionNotPendingError,
} from '../../domain/errors/DomainErrors'
import { IRejectTransactionUseCase } from '../ports/input/transaction.use-cases.port'
import { ITransactionRepository } from '../ports/output/ITransactionRepository'

export class RejectTransactionUseCase implements IRejectTransactionUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  async execute(transactionId: string, reason?: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findById(transactionId)
    if (!transaction) throw new TransactionNotFoundError(transactionId)
    if (transaction.status !== 'pending') throw new TransactionNotPendingError()

    return this.transactionRepo.reject(transactionId, reason)
  }
}
