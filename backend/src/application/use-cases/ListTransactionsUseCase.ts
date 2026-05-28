import { UserNotFoundError } from '../../domain/errors/DomainErrors'
import { IListTransactionsUseCase } from '../ports/input/transaction.use-cases.port'
import { ITransactionRepository, PaginatedResult, PaginationParams } from '../ports/output/ITransactionRepository'
import { IUserRepository } from '../ports/output/IUserRepository'
import { Transaction } from '../../domain/entities/Transaction'

export class ListTransactionsUseCase implements IListTransactionsUseCase {
  constructor(
    private readonly userRepo:        IUserRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  async execute(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Transaction>> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new UserNotFoundError(userId)

    return this.transactionRepo.findByUserId(userId, pagination)
  }
}
