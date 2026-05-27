import { db } from './db'
import { users } from './schema'

async function seed() {
  await db.insert(users).values([
    { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Alice García',  email: 'alice@example.com',  balance: '100000.00' },
    { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'Bob Martínez',  email: 'bob@example.com',    balance: '50000.00'  },
    { id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'Carlos López',  email: 'carlos@example.com', balance: '25000.00'  },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', name: 'Diana Sánchez', email: 'diana@example.com',  balance: '75000.00'  },
  ]).onConflictDoNothing()

  console.log('Seed completed successfully')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
