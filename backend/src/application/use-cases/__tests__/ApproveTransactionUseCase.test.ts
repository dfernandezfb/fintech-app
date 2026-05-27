import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TransactionNotFoundError,
  TransactionNotPendingError,
} from '../../../domain/errors/DomainErrors'
import { ApproveTransactionUseCase } from '../ApproveTransactionUseCase'
import { aTransaction } from './fixtures'
import { mockTransactionRepo } from './mocks'

describe('ApproveTransactionUseCase', () => {
  let transactionRepo: ReturnType<typeof mockTransactionRepo>
  let useCase:         ApproveTransactionUseCase

  beforeEach(() => {
    transactionRepo = mockTransactionRepo()
    useCase         = new ApproveTransactionUseCase(transactionRepo)
  })

  it('throws TransactionNotFoundError when transaction does not exist', async () => {
    vi.mocked(transactionRepo.findById).mockResolvedValue(null)

    await expect(useCase.execute('unknown')).rejects.toThrow(TransactionNotFoundError)
  })

  it('throws TransactionNotPendingError when transaction is already confirmed', async () => {
    vi.mocked(transactionRepo.findById).mockResolvedValue(
      aTransaction({ status: 'confirmed' })
    )

    await expect(useCase.execute(aTransaction().id)).rejects.toThrow(TransactionNotPendingError)
  })

  it('throws TransactionNotPendingError when transaction is already rejected', async () => {
    vi.mocked(transactionRepo.findById).mockResolvedValue(
      aTransaction({ status: 'rejected' })
    )

    await expect(useCase.execute(aTransaction().id)).rejects.toThrow(TransactionNotPendingError)
  })

  it('approves the transaction and returns the confirmed transaction', async () => {
    const pending   = aTransaction({ status: 'pending' })
    const confirmed = aTransaction({ status: 'confirmed' })

    vi.mocked(transactionRepo.findById).mockResolvedValue(pending)
    vi.mocked(transactionRepo.approve).mockResolvedValue(confirmed)

    const result = await useCase.execute(pending.id)

    expect(transactionRepo.approve).toHaveBeenCalledWith(pending.id)
    expect(result.status).toBe('confirmed')
  })
})
