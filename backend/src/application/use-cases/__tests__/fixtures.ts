import { User } from '../../../domain/entities/User'
import { Transaction } from '../../../domain/entities/Transaction'

export const aUser = (overrides: Partial<User> = {}): User => ({
  id:        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  name:      'Alice García',
  email:     'alice@example.com',
  balance:   100000,
  createdAt: new Date('2024-01-01'),
  ...overrides,
})

export const anotherUser = (overrides: Partial<User> = {}): User => ({
  id:        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  name:      'Bob Martínez',
  email:     'bob@example.com',
  balance:   50000,
  createdAt: new Date('2024-01-01'),
  ...overrides,
})

export const aTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id:         'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  fromUserId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  toUserId:   'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  amount:     1000,
  status:     'pending',
  createdAt:  new Date('2024-01-01'),
  ...overrides,
})
