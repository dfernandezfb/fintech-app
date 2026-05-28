import { User } from '../../domain/entities/User'
import { IGetUsersUseCase } from '../ports/input/user.use-cases.port'
import { IUserRepository } from '../ports/output/IUserRepository'

export class GetUsersUseCase implements IGetUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepo.findAll()
  }
}
