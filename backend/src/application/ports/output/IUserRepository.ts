import { User } from '../../../domain/entities/User'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findAll(): Promise<User[]>
}
