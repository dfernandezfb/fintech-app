import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { UserController } from './user.controller'

interface UserRouteOptions extends FastifyPluginOptions {
  controller: UserController
}

export async function userRoutes(fastify: FastifyInstance, opts: UserRouteOptions) {
  const { controller } = opts

  fastify.get(
    '/users',
    {
      schema: {
        tags: ['Users'],
        summary: 'List all users',
        response: {
          200: { type: 'array', items: { $ref: 'User#' } },
        },
      },
    },
    controller.list.bind(controller)
  )
}
