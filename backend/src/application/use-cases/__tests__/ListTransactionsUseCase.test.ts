import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserNotFoundError } from '../../../domain/errors/DomainErrors'
import { ListTransactionsUseCase } from '../ListTransactionsUseCase'
import { aTransaction, aUser } from './fixtures'
import { mockTransactionRepo, mockUserRepo } from './mocks'

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

    await expect(useCase.execute('unknown')).rejects.toThrow(UserNotFoundError)
  })

  it('returns transactions for the user', async () => {
    const user = aUser()
    const txs  = [
      aTransaction({ id: '1', amount: 1000 }),
      aTransaction({ id: '2', amount: 2000 }),
    ]

    vi.mocked(userRepo.findById).mockResolvedValue(user)
    vi.mocked(transactionRepo.findByUserId).mockResolvedValue(txs)

    const result = await useCase.execute(user.id)

    expect(transactionRepo.findByUserId).toHaveBeenCalledWith(user.id)
    expect(result).toEqual(txs)
  })

  it('returns an empty array when user has no transactions', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(aUser())
    vi.mocked(transactionRepo.findByUserId).mockResolvedValue([])

    const result = await useCase.execute(aUser().id)

    expect(result).toEqual([])
  })
})
