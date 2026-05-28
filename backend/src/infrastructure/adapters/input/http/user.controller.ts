import { FastifyReply, FastifyRequest } from 'fastify'
import { IGetUsersUseCase } from '../../../../application/ports/input/user.use-cases.port'

export class UserController {
  constructor(private readonly getUsers: IGetUsersUseCase) {}

  async list(_request: FastifyRequest, reply: FastifyReply) {
    const users = await this.getUsers.execute()
    return reply.send(users)
  }
}
