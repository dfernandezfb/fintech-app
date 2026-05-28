import Fastify from 'fastify'
import { vi } from 'vitest'
import { TransactionController } from '../transaction.controller'
import { UserController } from '../user.controller'
import { errorHandler } from '../error.handler'
import { userRoutes } from '../user.routes'
import { transactionRoutes } from '../transaction.routes'

/**
 * Builds a minimal Fastify instance for route-level tests.
 * Skips Swagger/CORS/DB — only registers schemas, error handler and routes.
 */
export async function buildTestApp(
  userController: UserController,
  transactionController: TransactionController,
) {
  const app = Fastify({ logger: false })

  app.addSchema({
    $id: 'User',
    type: 'object',
    properties: {
      id:        { type: 'string' },
      name:      { type: 'string' },
      email:     { type: 'string' },
      balance:   { type: 'number' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  })

  app.addSchema({
    $id: 'Transaction',
    type: 'object',
    properties: {
      id:              { type: 'string' },
      fromUserId:      { type: 'string' },
      toUserId:        { type: 'string' },
      amount:          { type: 'number' },
      status:          { type: 'string', enum: ['pending', 'confirmed', 'rejected'] },
      rejectionReason: { type: 'string', nullable: true },
      createdAt:       { type: 'string', format: 'date-time' },
    },
  })

  app.setErrorHandler(errorHandler)
  await app.register(userRoutes,        { controller: userController })
  await app.register(transactionRoutes, { controller: transactionController })
  await app.ready()

  return app
}

/**
 * Creates mock use-case objects and wires them into real controllers.
 * Each mock's `execute` is a `vi.fn()` — call `.mockResolvedValue(...)` in tests.
 */
export function buildMockControllers() {
  const useCases = {
    getUsers:           { execute: vi.fn() },
    createTransaction:  { execute: vi.fn() },
    listTransactions:   { execute: vi.fn() },
    listPending:        { execute: vi.fn() },
    approveTransaction: { execute: vi.fn() },
    rejectTransaction:  { execute: vi.fn() },
  }

  const userCtrl = new UserController(useCases.getUsers as any)
  const txCtrl   = new TransactionController(
    useCases.createTransaction  as any,
    useCases.listTransactions   as any,
    useCases.listPending        as any,
    useCases.approveTransaction as any,
    useCases.rejectTransaction  as any,
  )

  return { userCtrl, txCtrl, useCases }
}
