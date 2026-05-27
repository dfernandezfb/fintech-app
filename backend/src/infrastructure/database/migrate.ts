import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { join } from 'path'
import { db } from './db'

async function runMigrations() {
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: join(__dirname, 'migrations') })
  console.log('Migrations completed successfully')
  process.exit(0)
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
