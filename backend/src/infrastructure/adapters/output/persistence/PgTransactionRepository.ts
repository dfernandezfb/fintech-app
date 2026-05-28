import { and, eq, inArray, InferSelectModel, or, sql } from 'drizzle-orm'
import { Transaction } from '../../../../domain/entities/Transaction'
import {
  InsufficientBalanceError,
  TransactionNotFoundError,
  TransactionNotPendingError,
  UserNotFoundError,
} from '../../../../domain/errors/DomainErrors'
import {
  CreateTransactionParams,
  ITransactionRepository,
} from '../../../../application/ports/output/ITransactionRepository'
import { DrizzleDb } from '../../../database/db'
import { balanceMovements, transactions, users } from '../../../database/schema'

type TransactionRow = InferSelectModel<typeof transactions>

function mapRow(row: TransactionRow): Transaction {
  return {
    id:              row.id,
    fromUserId:      row.fromUserId,
    toUserId:        row.toUserId,
    amount:          parseFloat(row.amount),
    status:          row.status,
    rejectionReason: row.rejectionReason ?? undefined,
    createdAt:       row.createdAt,
  }
}

export class PgTransactionRepository implements ITransactionRepository {
  constructor(private readonly db: DrizzleDb) {}

  async findById(id: string): Promise<Transaction | null> {
    const [row] = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)

    return row ? mapRow(row) : null
  }

  async findAllPending(): Promise<Transaction[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.status, 'pending'))
      .orderBy(sql`${transactions.createdAt} desc`)

    return rows.map(mapRow)
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(
        or(eq(transactions.fromUserId, userId), eq(transactions.toUserId, userId))
      )
      .orderBy(sql`${transactions.createdAt} desc`)

    return rows.map(mapRow)
  }

  async createPending(params: CreateTransactionParams): Promise<Transaction> {
    const [row] = await this.db
      .insert(transactions)
      .values({
        fromUserId: params.fromUserId,
        toUserId:   params.toUserId,
        amount:     String(params.amount),
        status:     'pending',
      })
      .returning()

    return mapRow(row)
  }

  async createAndConfirm(params: CreateTransactionParams): Promise<Transaction> {
    return this.db.transaction(async (tx) => {
      // Lock sender to serialize concurrent transactions from same origin
      const [sender] = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, params.fromUserId))
        .for('update')

      if (!sender) throw new UserNotFoundError(params.fromUserId)
      if (parseFloat(sender.balance) < params.amount) throw new InsufficientBalanceError()

      // Debit — PostgreSQL computes balance_before/after with exact NUMERIC arithmetic
      const [senderResult] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} - ${String(params.amount)}` })
        .where(eq(users.id, params.fromUserId))
        .returning({
          balanceAfter:  users.balance,
          balanceBefore: sql<string>`${users.balance} + ${String(params.amount)}`,
        })

      // Credit — implicit row lock from UPDATE
      const [receiverResult] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${String(params.amount)}` })
        .where(eq(users.id, params.toUserId))
        .returning({
          balanceAfter:  users.balance,
          balanceBefore: sql<string>`${users.balance} - ${String(params.amount)}`,
        })

      if (!receiverResult) throw new UserNotFoundError(params.toUserId)

      const [newTx] = await tx
        .insert(transactions)
        .values({
          fromUserId: params.fromUserId,
          toUserId:   params.toUserId,
          amount:     String(params.amount),
          status:     'confirmed',
        })
        .returning()

      await tx.insert(balanceMovements).values([
        {
          transactionId: newTx.id,
          userId:        params.fromUserId,
          type:          'debit',
          amount:        String(params.amount),
          balanceBefore: senderResult.balanceBefore,
          balanceAfter:  senderResult.balanceAfter,
        },
        {
          transactionId: newTx.id,
          userId:        params.toUserId,
          type:          'credit',
          amount:        String(params.amount),
          balanceBefore: receiverResult.balanceBefore,
          balanceAfter:  receiverResult.balanceAfter,
        },
      ])

      return mapRow(newTx)
    })
  }

  async approve(transactionId: string): Promise<Transaction> {
    return this.db.transaction(async (tx) => {
      // Lock transaction row — serializes concurrent approve/reject calls
      const [pending] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .for('update')

      if (!pending) throw new TransactionNotFoundError(transactionId)
      if (pending.status !== 'pending') throw new TransactionNotPendingError()

      const amount = parseFloat(pending.amount)

      // Lock sender to check balance
      const [sender] = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, pending.fromUserId))
        .for('update')

      if (!sender) throw new UserNotFoundError(pending.fromUserId)
      if (parseFloat(sender.balance) < amount) throw new InsufficientBalanceError()

      const [senderResult] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} - ${String(amount)}` })
        .where(eq(users.id, pending.fromUserId))
        .returning({
          balanceAfter:  users.balance,
          balanceBefore: sql<string>`${users.balance} + ${String(amount)}`,
        })

      const [receiverResult] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${String(amount)}` })
        .where(eq(users.id, pending.toUserId))
        .returning({
          balanceAfter:  users.balance,
          balanceBefore: sql<string>`${users.balance} - ${String(amount)}`,
        })

      if (!receiverResult) throw new UserNotFoundError(pending.toUserId)

      const [confirmed] = await tx
        .update(transactions)
        .set({ status: 'confirmed' })
        .where(eq(transactions.id, transactionId))
        .returning()

      await tx.insert(balanceMovements).values([
        {
          transactionId,
          userId:        pending.fromUserId,
          type:          'debit',
          amount:        String(amount),
          balanceBefore: senderResult.balanceBefore,
          balanceAfter:  senderResult.balanceAfter,
        },
        {
          transactionId,
          userId:        pending.toUserId,
          type:          'credit',
          amount:        String(amount),
          balanceBefore: receiverResult.balanceBefore,
          balanceAfter:  receiverResult.balanceAfter,
        },
      ])

      // Auto-reject any remaining pending transactions from the same sender
      // whose amount now exceeds the updated balance.
      // This can happen when multiple large transactions were created as pending
      // simultaneously — each was valid on its own, but together they exceed
      // the sender's funds.
      const newBalance = parseFloat(senderResult.balanceAfter)

      const otherPending = await tx
        .select({ id: transactions.id, amount: transactions.amount })
        .from(transactions)
        .where(
          and(
            eq(transactions.fromUserId, pending.fromUserId),
            eq(transactions.status, 'pending'),
          )
        )

      const toRejectIds = otherPending
        .filter((t) => parseFloat(t.amount) > newBalance)
        .map((t) => t.id)

      if (toRejectIds.length > 0) {
        await tx
          .update(transactions)
          .set({
            status:          'rejected',
            rejectionReason: 'Saldo insuficiente tras la aprobación de otra transacción',
          })
          .where(inArray(transactions.id, toRejectIds))
      }

      return mapRow(confirmed)
    })
  }

  async reject(transactionId: string, reason?: string): Promise<Transaction> {
    return this.db.transaction(async (tx) => {
      // Lock transaction row
      const [pending] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .for('update')

      if (!pending) throw new TransactionNotFoundError(transactionId)
      if (pending.status !== 'pending') throw new TransactionNotPendingError()

      const [rejected] = await tx
        .update(transactions)
        .set({ status: 'rejected', rejectionReason: reason ?? null })
        .where(eq(transactions.id, transactionId))
        .returning()

      return mapRow(rejected)
    })
  }
}
