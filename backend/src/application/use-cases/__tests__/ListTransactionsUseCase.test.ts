import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserNotFoundError } from '../../../domain/errors/DomainErrors'
import { ListTransactionsUseCase } from '../ListTransactionsUseCase'
import { aTransaction, aUser } from './fixtures'
import { mockTransactionRepo, mockUserRepo } from './mocks'

const DEFAULT_PAGINATION = { page: 1, limit: 20 }

const aPaginatedResult = (txs = [aTransaction()]) => ({
  data:         txs,
  total:        txs.length,
  page:         1,
  limit:        20,
  totalPages:   Math.ceil(txs.length / 20),
  statusCounts: { confirmed: 0, pending: 0, rejected: 0 },
})

describe('ListTransactionsUseCase', () => {
  let userRepo:        ReturnType<typeof mockUserRepo>
  let transactionRepo: ReturnType<typeof mockTransactionRepo>
  let useCase:         ListTransactionsUseCase

  beforeEach(() => {
    userRepo        = mockUserRepo()
    transactionRepo = mockTransactionRepo()
    useCase         = new ListTransactionsUseCase(userRepo, transactionRepo)
  })

  it('throws UserNotFoundError when user does not exist', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null)

    await expect(useCase.execute('unknown', DEFAULT_PAGINATION)).rejects.toThrow(UserNotFoundError)
  })

  it('returns paginated transactions for the user', async () => {
    const user = aUser()
    const txs  = [
      aTransaction({ id: '1', amount: 1000 }),
      aTransaction({ id: '2', amount: 2000 }),
    ]
    const paginated = aPaginatedResult(txs)

    vi.mocked(userRepo.findById).mockResolvedValue(user)
    vi.mocked(transactionRepo.findByUserId).mockResolvedValue(paginated)

    const result = await useCase.execute(user.id, DEFAULT_PAGINATION)

    expect(transactionRepo.findByUserId).toHaveBeenCalledWith(user.id, DEFAULT_PAGINATION)
    expect(result).toEqual(paginated)
  })

  it('returns empty paginated result when user has no transactions', async () => {
    const paginated = aPaginatedResult([])
    vi.mocked(userRepo.findById).mockResolvedValue(aUser())
    vi.mocked(transactionRepo.findByUserId).mockResolvedValue(paginated)

    const result = await useCase.execute(aUser().id, DEFAULT_PAGINATION)

    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
  })
})
