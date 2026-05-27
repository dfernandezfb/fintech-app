import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  InsufficientBalanceError,
  InvalidAmountError,
  SameUserTransactionError,
  UserNotFoundError,
} from '../../../domain/errors/DomainErrors'
import { CreateTransactionUseCase } from '../CreateTransactionUseCase'
import { aTransaction, aUser, anotherUser } from './fixtures'
import { mockTransactionRepo, mockUserRepo } from './mocks'

describe('CreateTransactionUseCase', () => {
  let userRepo:        ReturnType<typeof mockUserRepo>
  let transactionRepo: ReturnType<typeof mockTransactionRepo>
  let useCase:         CreateTransactionUseCase

  beforeEach(() => {
    userRepo        = mockUserRepo()
    transactionRepo = mockTransactionRepo()
    useCase         = new CreateTransactionUseCase(userRepo, transactionRepo)
  })

  describe('input validation', () => {
    it('throws InvalidAmountError when amount is 0', async () => {
      await expect(
        useCase.execute({ fromUserId: 'x', toUserId: 'y', amount: 0 })
      ).rejects.toThrow(InvalidAmountError)
    })

    it('throws InvalidAmountError when amount is negative', async () => {
      await expect(
        useCase.execute({ fromUserId: 'x', toUserId: 'y', amount: -500 })
      ).rejects.toThrow(InvalidAmountError)
    })

    it('throws SameUserTransactionError when sender and receiver are the same user', async () => {
      await expect(
        useCase.execute({ fromUserId: 'x', toUserId: 'x', amount: 100 })
      ).rejects.toThrow(SameUserTransactionError)
    })
  })

  describe('user validation', () => {
    it('throws UserNotFoundError when sender does not exist', async () => {
      vi.mocked(userRepo.findById).mockImplementation(async (id) => {
        if (id === anotherUser().id) return anotherUser()
        return null
      })

      await expect(
        useCase.execute({ fromUserId: 'unknown', toUserId: anotherUser().id, amount: 100 })
      ).rejects.toThrow(UserNotFoundError)
    })

    it('throws UserNotFoundError when receiver does not exist', async () => {
      vi.mocked(userRepo.findById).mockImplementation(async (id) => {
        if (id === aUser().id) return aUser()
        return null
      })

      await expect(
        useCase.execute({ fromUserId: aUser().id, toUserId: 'unknown', amount: 100 })
      ).rejects.toThrow(UserNotFoundError)
    })
  })

  describe('balance validation', () => {
    it('throws InsufficientBalanceError when sender balance is lower than amount (small transaction)', async () => {
      const sender = aUser({ balance: 500 })
      vi.mocked(userRepo.findById).mockImplementation(async (id) =>
        id === sender.id ? sender : anotherUser()
      )

      await expect(
        useCase.execute({ fromUserId: sender.id, toUserId: anotherUser().id, amount: 1000 })
      ).rejects.toThrow(InsufficientBalanceError)
    })

    it('throws InsufficientBalanceError when sender balance is lower than amount (large transaction)', async () => {
      const sender = aUser({ balance: 10000 })
      vi.mocked(userRepo.findById).mockImplementation(async (id) =>
        id === sender.id ? sender : anotherUser()
      )

      await expect(
        useCase.execute({ fromUserId: sender.id, toUserId: anotherUser().id, amount: 60000 })
      ).rejects.toThrow(InsufficientBalanceError)
    })

    it('succeeds when sender balance exactly equals the amount', async () => {
      const sender   = aUser({ balance: 1000 })
      const receiver = anotherUser()
      vi.mocked(userRepo.findById).mockImplementation(async (id) =>
        id === sender.id ? sender : receiver
      )
      const confirmed = aTransaction({ status: 'confirmed', amount: 1000 })
      vi.mocked(transactionRepo.createAndConfirm).mockResolvedValue(confirmed)

      const result = await useCase.execute({
        fromUserId: sender.id,
        toUserId:   receiver.id,
        amount:     1000,
      })

      expect(result.status).toBe('confirmed')
    })
  })

  describe('transaction routing', () => {
    beforeEach(() => {
      const sender   = aUser({ balance: 100000 })
      const receiver = anotherUser()
      vi.mocked(userRepo.findById).mockImplementation(async (id) =>
        id === sender.id ? sender : receiver
      )
    })

    it('auto-confirms transaction when amount is at or below 50000', async () => {
      const confirmed = aTransaction({ status: 'confirmed', amount: 50000 })
      vi.mocked(transactionRepo.createAndConfirm).mockResolvedValue(confirmed)

      const result = await useCase.execute({
        fromUserId: aUser().id,
        toUserId:   anotherUser().id,
        amount:     50000,
      })

      expect(transactionRepo.createAndConfirm).toHaveBeenCalledOnce()
      expect(transactionRepo.createPending).not.toHaveBeenCalled()
      expect(result.status).toBe('confirmed')
    })

    it('creates pending transaction when amount exceeds 50000', async () => {
      const pending = aTransaction({ status: 'pending', amount: 60000 })
      vi.mocked(transactionRepo.createPending).mockResolvedValue(pending)

      const result = await useCase.execute({
        fromUserId: aUser().id,
        toUserId:   anotherUser().id,
        amount:     60000,
      })

      expect(transactionRepo.createPending).toHaveBeenCalledOnce()
      expect(transactionRepo.createAndConfirm).not.toHaveBeenCalled()
      expect(result.status).toBe('pending')
    })
  })
})
