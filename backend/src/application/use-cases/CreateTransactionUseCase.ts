import { Transaction } from '../../domain/entities/Transaction'
import {
  InsufficientBalanceError,
  InvalidAmountError,
  SameUserTransactionError,
  UserNotFoundError,
} from '../../domain/errors/DomainErrors'
import { ICreateTransactionUseCase } from '../ports/input/transaction.use-cases.port'
import {
  CreateTransactionParams,
  ITransactionRepository,
} from '../ports/output/ITransactionRepository'
import { IUserRepository } from '../ports/output/IUserRepository'

const LARGE_TRANSACTION_THRESHOLD = 50000

export class CreateTransactionUseCase implements ICreateTransactionUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  async execute(params: CreateTransactionParams): Promise<Transaction> {
    if (params.amount <= 0) throw new InvalidAmountError()
    if (params.fromUserId === params.toUserId) throw new SameUserTransactionError()

    const [sender, receiver] = await Promise.all([
      this.userRepo.findById(params.fromUserId),
      this.userRepo.findById(params.toUserId),
    ])

    if (!sender) throw new UserNotFoundError(params.fromUserId)
    if (!receiver) throw new UserNotFoundError(params.toUserId)

    if (sender.balance < params.amount) throw new InsufficientBalanceError()

    if (params.amount > LARGE_TRANSACTION_THRESHOLD) {
      return this.transactionRepo.createPending(params)
    }

    return this.transactionRepo.createAndConfirm(params)
  }
}
