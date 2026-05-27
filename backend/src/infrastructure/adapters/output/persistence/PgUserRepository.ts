import { eq } from 'drizzle-orm'
import { User } from '../../../../domain/entities/User'
import { IUserRepository } from '../../../../application/ports/output/IUserRepository'
import { DrizzleDb } from '../../../database/db'
import { users } from '../../../database/schema'

export class PgUserRepository implements IUserRepository {
  constructor(private readonly db: DrizzleDb) {}

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!row) return null

    return {
      id:        row.id,
      name:      row.name,
      email:     row.email,
      balance:   parseFloat(row.balance),
      createdAt: row.createdAt,
    }
  }
}
