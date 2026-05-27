import { check, index, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'confirmed',
  'rejected',
])

export const movementTypeEnum = pgEnum('movement_type', ['debit', 'credit'])

export const users = pgTable(
  'users',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    name:      varchar('name', { length: 255 }).notNull(),
    email:     varchar('email', { length: 255 }).notNull().unique(),
    balance:   numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    check('balance_non_negative', sql`${t.balance} >= 0`),
  ]
)

export const transactions = pgTable(
  'transactions',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    fromUserId:      uuid('from_user_id').notNull().references(() => users.id),
    toUserId:        uuid('to_user_id').notNull().references(() => users.id),
    amount:          numeric('amount', { precision: 15, scale: 2 }).notNull(),
    status:          transactionStatusEnum('status').notNull().default('pending'),
    rejectionReason: text('rejection_reason'),
    createdAt:       timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    check('amount_positive', sql`${t.amount} > 0`),
    index('idx_tx_from_user').on(t.fromUserId),
    index('idx_tx_to_user').on(t.toUserId),
    index('idx_tx_created_at').on(t.createdAt),
  ]
)

export const balanceMovements = pgTable(
  'balance_movements',
  {
    id:            uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id').notNull().references(() => transactions.id),
    userId:        uuid('user_id').notNull().references(() => users.id),
    type:          movementTypeEnum('type').notNull(),
    amount:        numeric('amount', { precision: 15, scale: 2 }).notNull(),
    balanceBefore: numeric('balance_before', { precision: 15, scale: 2 }).notNull(),
    balanceAfter:  numeric('balance_after', { precision: 15, scale: 2 }).notNull(),
    createdAt:     timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_bm_transaction').on(t.transactionId),
    index('idx_bm_user').on(t.userId),
  ]
)
