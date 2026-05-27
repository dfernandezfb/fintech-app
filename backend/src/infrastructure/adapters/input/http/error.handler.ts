import { FastifyReply, FastifyRequest } from 'fastify'
import { DomainError } from '../../../../domain/errors/DomainErrors'

export function errorHandler(
  error: Error & { statusCode?: number; validation?: unknown },
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof DomainError) {
    return reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
    })
  }

  if (error.statusCode === 400 && error.validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: error.message,
    })
  }

  request.log.error(error, 'Unhandled error')
  return reply.status(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  })
}
