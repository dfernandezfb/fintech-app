import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TransactionNotFoundError,
  TransactionNotPendingError,
} from '../../../domain/errors/DomainErrors'
import { RejectTransactionUseCase } from '../RejectTransactionUseCase'
import { aTransaction } from './fixtures'
import { mockTransactionRepo } from './mocks'

describe('RejectTransactionUseCase', () => {
  let transactionRepo: ReturnType<typeof mockTransactionRepo>
  let useCase:         RejectTransactionUseCase

  beforeEach(() => {
    transactionRepo = mockTransactionRepo()
    useCase         = new RejectTransactionUseCase(transactionRepo)
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

  it('rejects the transaction without a reason', async () => {
    const pending  = aTransaction({ status: 'pending' })
    const rejected = aTransaction({ status: 'rejected' })

    vi.mocked(transactionRepo.findById).mockResolvedValue(pending)
    vi.mocked(transactionRepo.reject).mockResolvedValue(rejected)

    const result = await useCase.execute(pending.id)

    expect(transactionRepo.reject).toHaveBeenCalledWith(pending.id, undefined)
    expect(result.status).toBe('rejected')
  })

  it('rejects the transaction with a reason', async () => {
    const pending  = aTransaction({ status: 'pending' })
    const rejected = aTransaction({ status: 'rejected', rejectionReason: 'Suspicious activity' })

    vi.mocked(transactionRepo.findById).mockResolvedValue(pending)
    vi.mocked(transactionRepo.reject).mockResolvedValue(rejected)

    const result = await useCase.execute(pending.id, 'Suspicious activity')

    expect(transactionRepo.reject).toHaveBeenCalledWith(pending.id, 'Suspicious activity')
    expect(result.rejectionReason).toBe('Suspicious activity')
  })
})
