import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListPendingTransactionsUseCase } from '../ListPendingTransactionsUseCase'
import { aTransaction } from './fixtures'
import { mockTransactionRepo } from './mocks'

describe('ListPendingTransactionsUseCase', () => {
  let transactionRepo: ReturnType<typeof mockTransactionRepo>
  let useCase:         ListPendingTransactionsUseCase

  beforeEach(() => {
    transactionRepo = mockTransactionRepo()
    useCase         = new ListPendingTransactionsUseCase(transactionRepo)
  })

  it('returns an empty array when there are no pending transactions', async () => {
    vi.mocked(transactionRepo.findAllPending).mockResolvedValue([])

    const result = await useCase.execute()

    expect(result).toEqual([])
  })

  it('returns all pending transactions from the repository', async () => {
    const pending = [
      aTransaction({ id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', status: 'pending', amount: 60_000 }),
      aTransaction({ id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', status: 'pending', amount: 75_000 }),
    ]
    vi.mocked(transactionRepo.findAllPending).mockResolvedValue(pending)

    const result = await useCase.execute()

    expect(result).toEqual(pending)
    expect(result).toHaveLength(2)
  })

  it('delegates to transactionRepo.findAllPending()', async () => {
    vi.mocked(transactionRepo.findAllPending).mockResolvedValue([])

    await useCase.execute()

    expect(transactionRepo.findAllPending).toHaveBeenCalledOnce()
  })

  it('does not call any other repository method', async () => {
    vi.mocked(transactionRepo.findAllPending).mockResolvedValue([])

    await useCase.execute()

    expect(transactionRepo.findById).not.toHaveBeenCalled()
    expect(transactionRepo.findByUserId).not.toHaveBeenCalled()
    expect(transactionRepo.createAndConfirm).not.toHaveBeenCalled()
    expect(transactionRepo.createPending).not.toHaveBeenCalled()
  })
})
