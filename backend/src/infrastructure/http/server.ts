import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'
import { errorHandler } from '../adapters/input/http/error.handler'
import { transactionRoutes } from '../adapters/input/http/transaction.routes'
import { userRoutes } from '../adapters/input/http/user.routes'
import { transactionController, userController } from '../config/container'

export async function buildServer() {
  const fastify = Fastify({
    logger:
      process.env.NODE_ENV === 'production'
        ? { level: 'info' }
        : {
            level: 'info',
            transport: {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
            },
          },
  })

  await fastify.register(cors, { origin: true })

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Fintech Payment API',
        description: 'API for routing and validating internal payments between users',
        version: '1.0.0',
      },
    },
  })

  await fastify.register(swaggerUi, { routePrefix: '/docs' })

  fastify.addSchema({
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

  fastify.addSchema({
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

  fastify.setErrorHandler(errorHandler)

  fastify.get('/health', { schema: { hide: true } }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  await fastify.register(userRoutes,        { controller: userController })
  await fastify.register(transactionRoutes, { controller: transactionController })

  return fastify
}
