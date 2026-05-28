import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  InsufficientBalanceError,
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

  it('throws InsufficientBalanceError when the sender no longer has enough balance at approval time', async () => {
    // This can happen legitimately: e.g. another transaction from the same
    // sender was confirmed in between, draining the balance.
    // The repository handles the balance check atomically (SELECT FOR UPDATE).
    // The auto-reject of other pending transactions whose amount now exceeds
    // the updated balance is also handled by the repository — it is an
    // internal DB concern not visible at this layer.
    const pending = aTransaction({ status: 'pending' })

    vi.mocked(transactionRepo.findById).mockResolvedValue(pending)
    vi.mocked(transactionRepo.approve).mockRejectedValue(new InsufficientBalanceError())

    await expect(useCase.execute(pending.id)).rejects.toThrow(InsufficientBalanceError)
  })
})
