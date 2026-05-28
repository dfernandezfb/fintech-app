import { vi } from 'vitest'
import { IUserRepository } from '../../ports/output/IUserRepository'
import { ITransactionRepository } from '../../ports/output/ITransactionRepository'

export const mockUserRepo = (): IUserRepository => ({
  findById: vi.fn(),
  findAll:  vi.fn(),
})

export const mockTransactionRepo = (): ITransactionRepository => ({
  findById:         vi.fn(),
  findByUserId:     vi.fn(),
  findAllPending:   vi.fn(),
  createAndConfirm: vi.fn(),
  createPending:    vi.fn(),
  approve:          vi.fn(),
  reject:           vi.fn(),
})
