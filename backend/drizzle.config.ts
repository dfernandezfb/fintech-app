import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema:  './src/infrastructure/database/schema.ts',
  out:     './src/infrastructure/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host:     process.env.DB_HOST!,
    port:     Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME!,
    user:     process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    ssl:      false,
  },
})
