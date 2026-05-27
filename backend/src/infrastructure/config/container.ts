import { ApproveTransactionUseCase } from '../../application/use-cases/ApproveTransactionUseCase'
import { CreateTransactionUseCase } from '../../application/use-cases/CreateTransactionUseCase'
import { ListTransactionsUseCase } from '../../application/use-cases/ListTransactionsUseCase'
import { RejectTransactionUseCase } from '../../application/use-cases/RejectTransactionUseCase'
import { TransactionController } from '../adapters/input/http/transaction.controller'
import { PgTransactionRepository } from '../adapters/output/persistence/PgTransactionRepository'
import { PgUserRepository } from '../adapters/output/persistence/PgUserRepository'
import { db } from '../database/db'

const userRepo        = new PgUserRepository(db)
const transactionRepo = new PgTransactionRepository(db)

const createTransaction  = new CreateTransactionUseCase(userRepo, transactionRepo)
const listTransactions   = new ListTransactionsUseCase(userRepo, transactionRepo)
const approveTransaction = new ApproveTransactionUseCase(transactionRepo)
const rejectTransaction  = new RejectTransactionUseCase(transactionRepo)

export const transactionController = new TransactionController(
  createTransaction,
  listTransactions,
  approveTransaction,
  rejectTransaction
)
