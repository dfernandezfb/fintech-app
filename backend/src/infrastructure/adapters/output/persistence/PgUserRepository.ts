import { eq } from 'drizzle-orm'
import { User } from '../../../../domain/entities/User'
import { IUserRepository } from '../../../../application/ports/output/IUserRepository'
import { DrizzleDb } from '../../../database/db'
import { users } from '../../../database/schema'

type UserRow = typeof users.$inferSelect

function mapRow(row: UserRow): User {
  return {
    id:        row.id,
    name:      row.name,
    email:     row.email,
    balance:   parseFloat(row.balance),
    createdAt: row.createdAt,
  }
}

export class PgUserRepository implements IUserRepository {
  constructor(private readonly db: DrizzleDb) {}

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return row ? mapRow(row) : null
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db
      .select()
      .from(users)
      .orderBy(users.name)

    return rows.map(mapRow)
  }
}
