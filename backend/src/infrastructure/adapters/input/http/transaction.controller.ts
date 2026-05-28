import { FastifyReply, FastifyRequest } from 'fastify'
import {
  IApproveTransactionUseCase,
  ICreateTransactionUseCase,
  IListPendingTransactionsUseCase,
  IListTransactionsUseCase,
  IRejectTransactionUseCase,
} from '../../../../application/ports/input/transaction.use-cases.port'

export class TransactionController {
  constructor(
    private readonly createTransaction: ICreateTransactionUseCase,
    private readonly listTransactions: IListTransactionsUseCase,
    private readonly listPendingTransactions: IListPendingTransactionsUseCase,
    private readonly approveTransaction: IApproveTransactionUseCase,
    private readonly rejectTransaction: IRejectTransactionUseCase
  ) {}

  async create(
    request: FastifyRequest<{ Body: { fromUserId: string; toUserId: string; amount: number } }>,
    reply: FastifyReply
  ) {
    const transaction = await this.createTransaction.execute(request.body)
    const statusCode = transaction.status === 'pending' ? 202 : 201
    return reply.status(statusCode).send(transaction)
  }

  async list(
    request: FastifyRequest<{ Querystring: { userId: string } }>,
    reply: FastifyReply
  ) {
    const transactions = await this.listTransactions.execute(request.query.userId)
    return reply.send(transactions)
  }

  async listPending(_request: FastifyRequest, reply: FastifyReply) {
    const transactions = await this.listPendingTransactions.execute()
    return reply.send(transactions)
  }

  async approve(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const transaction = await this.approveTransaction.execute(request.params.id)
    return reply.send(transaction)
  }

  async reject(
    request: FastifyRequest<{ Params: { id: string }; Body: { reason?: string } }>,
    reply: FastifyReply
  ) {
    const transaction = await this.rejectTransaction.execute(
      request.params.id,
      request.body?.reason
    )
    return reply.send(transaction)
  }
}
