import { Transaction } from '../../domain/entities/Transaction'
import { IListPendingTransactionsUseCase } from '../ports/input/transaction.use-cases.port'
import { ITransactionRepository } from '../ports/output/ITransactionRepository'

export class ListPendingTransactionsUseCase implements IListPendingTransactionsUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  async execute(): Promise<Transaction[]> {
    return this.transactionRepo.findAllPending()
  }
}
