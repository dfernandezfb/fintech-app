import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { TransactionController } from './transaction.controller'

const UUID_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

interface TransactionRouteOptions extends FastifyPluginOptions {
  controller: TransactionController
}

export async function transactionRoutes(
  fastify: FastifyInstance,
  opts: TransactionRouteOptions
) {
  const { controller } = opts

  fastify.post(
    '/transactions',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Create a new transaction',
        body: {
          type: 'object',
          required: ['fromUserId', 'toUserId', 'amount'],
          properties: {
            fromUserId: { type: 'string', pattern: UUID_PATTERN },
            toUserId: { type: 'string', pattern: UUID_PATTERN },
            amount: { type: 'number', exclusiveMinimum: 0 },
          },
        },
        response: {
          201: { $ref: 'Transaction#' },
          202: { $ref: 'Transaction#' },
        },
      },
    },
    controller.create.bind(controller)
  )

  fastify.get(
    '/transactions/pending',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'List all pending transactions',
        response: {
          200: { type: 'array', items: { $ref: 'Transaction#' } },
        },
      },
    },
    controller.listPending.bind(controller)
  )

  fastify.get(
    '/transactions',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'List transactions for a user',
        querystring: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', pattern: UUID_PATTERN },
          },
        },
        response: {
          200: { type: 'array', items: { $ref: 'Transaction#' } },
        },
      },
    },
    controller.list.bind(controller)
  )

  fastify.patch(
    '/transactions/:id/approve',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Approve a pending transaction and transfer funds',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: UUID_PATTERN },
          },
        },
        response: {
          200: { $ref: 'Transaction#' },
        },
      },
    },
    controller.approve.bind(controller)
  )

  fastify.patch(
    '/transactions/:id/reject',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Reject a pending transaction',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: UUID_PATTERN },
          },
        },
        body: {
          type: 'object',
          properties: {
            reason: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: { $ref: 'Transaction#' },
        },
      },
    },
    controller.reject.bind(controller)
  )
}
