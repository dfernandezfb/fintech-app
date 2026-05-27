import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../config/env'
import * as schema from './schema'

const pool = new Pool({
  host:                   env.db.host,
  port:                   env.db.port,
  database:               env.db.database,
  user:                   env.db.user,
  password:               env.db.password,
  max:                    20,
  idleTimeoutMillis:      30000,
  connectionTimeoutMillis: 2000,
})

export const db = drizzle(pool, { schema })

export type DrizzleDb = typeof db
