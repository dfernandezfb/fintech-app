import { ApproveTransactionUseCase } from '../../application/use-cases/ApproveTransactionUseCase'
import { CreateTransactionUseCase } from '../../application/use-cases/CreateTransactionUseCase'
import { GetUsersUseCase } from '../../application/use-cases/GetUsersUseCase'
import { ListPendingTransactionsUseCase } from '../../application/use-cases/ListPendingTransactionsUseCase'
import { ListTransactionsUseCase } from '../../application/use-cases/ListTransactionsUseCase'
import { RejectTransactionUseCase } from '../../application/use-cases/RejectTransactionUseCase'
import { TransactionController } from '../adapters/input/http/transaction.controller'
import { UserController } from '../adapters/input/http/user.controller'
import { PgTransactionRepository } from '../adapters/output/persistence/PgTransactionRepository'
import { PgUserRepository } from '../adapters/output/persistence/PgUserRepository'
import { db } from '../database/db'

const userRepo        = new PgUserRepository(db)
const transactionRepo = new PgTransactionRepository(db)

const createTransaction         = new CreateTransactionUseCase(userRepo, transactionRepo)
const listTransactions          = new ListTransactionsUseCase(userRepo, transactionRepo)
const listPendingTransactions   = new ListPendingTransactionsUseCase(transactionRepo)
const approveTransaction        = new ApproveTransactionUseCase(transactionRepo)
const rejectTransaction         = new RejectTransactionUseCase(transactionRepo)
const getUsers                  = new GetUsersUseCase(userRepo)

export const transactionController = new TransactionController(
  createTransaction,
  listTransactions,
  listPendingTransactions,
  approveTransaction,
  rejectTransaction
)

export const userController = new UserController(getUsers)
