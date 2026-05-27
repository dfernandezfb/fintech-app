import { Transaction } from '../../domain/entities/Transaction'
import { UserNotFoundError } from '../../domain/errors/DomainErrors'
import { IListTransactionsUseCase } from '../ports/input/transaction.use-cases.port'
import { ITransactionRepository } from '../ports/output/ITransactionRepository'
import { IUserRepository } from '../ports/output/IUserRepository'

export class ListTransactionsUseCase implements IListTransactionsUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  async execute(userId: string): Promise<Transaction[]> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new UserNotFoundError(userId)

    return this.transactionRepo.findByUserId(userId)
  }
}
