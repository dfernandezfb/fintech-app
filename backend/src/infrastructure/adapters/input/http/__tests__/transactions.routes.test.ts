import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import {
  InsufficientBalanceError,
  TransactionNotFoundError,
  TransactionNotPendingError,
  UserNotFoundError,
} from '../../../../../domain/errors/DomainErrors'
import { aTransaction, aUser, anotherUser } from '../../../../../application/use-cases/__tests__/fixtures'
import { buildMockControllers, buildTestApp } from './app.helper'

// ── Shared fixtures ────────────────────────────────────────────────────────

const USER_A  = aUser()
const USER_B  = anotherUser()
const TX      = aTransaction({ status: 'confirmed' })
const TX_PEND = aTransaction({ status: 'pending', id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' })

describe('Transaction routes', () => {
  let app:      FastifyInstance
  let useCases: ReturnType<typeof buildMockControllers>['useCases']

  beforeAll(async () => {
    const mocks = buildMockControllers()
    useCases    = mocks.useCases
    app         = await buildTestApp(mocks.userCtrl, mocks.txCtrl)
  })

  afterAll(() => app.close())

  beforeEach(() => {
    Object.values(useCases).forEach((uc) => uc.execute.mockReset())
  })

  // ── GET /transactions/pending ────────────────────────────────────────────

  describe('GET /transactions/pending', () => {
    it('returns 200 with an empty array when there are no pending transactions', async () => {
      useCases.listPending.execute.mockResolvedValue([])

      const res = await app.inject({ method: 'GET', url: '/transactions/pending' })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual([])
    })

    it('returns 200 with pending transactions', async () => {
      useCases.listPending.execute.mockResolvedValue([TX_PEND])

      const res = await app.inject({ method: 'GET', url: '/transactions/pending' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveLength(1)
      expect(body[0].status).toBe('pending')
    })
  })

  // ── GET /transactions ────────────────────────────────────────────────────

  describe('GET /transactions', () => {
    it('returns 400 when userId query param is missing', async () => {
      const res = await app.inject({ method: 'GET', url: '/transactions' })

      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when userId is not a valid UUID', async () => {
      const res = await app.inject({ method: 'GET', url: '/transactions?userId=not-a-uuid' })

      expect(res.statusCode).toBe(400)
    })

    it('returns 404 when the user does not exist', async () => {
      useCases.listTransactions.execute.mockRejectedValue(new UserNotFoundError(USER_A.id))

      const res = await app.inject({
        method: 'GET',
        url:    `/transactions?userId=${USER_A.id}`,
      })

      expect(res.statusCode).toBe(404)
      expect(res.json()).toMatchObject({ error: 'USER_NOT_FOUND' })
    })

    it('returns 200 with paginated transactions for the user', async () => {
      useCases.listTransactions.execute.mockResolvedValue({
        data: [TX], total: 1, page: 1, limit: 20, totalPages: 1,
      })

      const res = await app.inject({
        method: 'GET',
        url:    `/transactions?userId=${USER_A.id}`,
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].id).toBe(TX.id)
      expect(body.total).toBe(1)
      expect(body.totalPages).toBe(1)
    })

    it('returns 200 with empty data when the user has no transactions', async () => {
      useCases.listTransactions.execute.mockResolvedValue({
        data: [], total: 0, page: 1, limit: 20, totalPages: 0,
      })

      const res = await app.inject({
        method: 'GET',
        url:    `/transactions?userId=${USER_A.id}`,
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toEqual([])
    })

    it('forwards page and limit query params to the use case', async () => {
      useCases.listTransactions.execute.mockResolvedValue({
        data: [], total: 0, page: 2, limit: 5, totalPages: 0,
      })

      await app.inject({
        method: 'GET',
        url:    `/transactions?userId=${USER_A.id}&page=2&limit=5`,
      })

      expect(useCases.listTransactions.execute).toHaveBeenCalledWith(
        USER_A.id,
        { page: 2, limit: 5 }
      )
    })
  })

  // ── POST /transactions ───────────────────────────────────────────────────

  describe('POST /transactions', () => {
    const validBody = {
      fromUserId: USER_A.id,
      toUserId:   USER_B.id,
      amount:     1000,
    }

    it('returns 400 when the request body is missing required fields', async () => {
      const res = await app.inject({
        method:  'POST',
        url:     '/transactions',
        payload: { fromUserId: USER_A.id },
      })

      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when amount is zero', async () => {
      const res = await app.inject({
        method:  'POST',
        url:     '/transactions',
        payload: { ...validBody, amount: 0 },
      })

      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when fromUserId is not a valid UUID', async () => {
      const res = await app.inject({
        method:  'POST',
        url:     '/transactions',
        payload: { ...validBody, fromUserId: 'not-a-uuid' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('returns 404 when the sender does not exist', async () => {
      useCases.createTransaction.execute.mockRejectedValue(new UserNotFoundError(USER_A.id))

      const res = await app.inject({
        method:  'POST',
        url:     '/transactions',
        payload: validBody,
      })

      expect(res.statusCode).toBe(404)
      expect(res.json()).toMatchObject({ error: 'USER_NOT_FOUND' })
    })

    it('returns 422 when the sender has insufficient balance', async () => {
      useCases.createTransaction.execute.mockRejectedValue(new InsufficientBalanceError())

      const res = await app.inject({
        method:  'POST',
        url:     '/transactions',
        payload: validBody,
      })

      expect(res.statusCode).toBe(422)
      expect(res.json()).toMatchObject({ error: 'INSUFFICIENT_BALANCE' })
    })

    it('returns 201 with a confirmed transaction for amounts ≤ 50 000', async () => {
      const confirmed = aTransaction({ status: 'confirmed', amount: 1000 })
      useCases.createTransaction.execute.mockResolvedValue(confirmed)

      const res = await app.inject({
        method:  'POST',
        url:     '/transactions',
        payload: validBody,
      })

      expect(res.statusCode).toBe(201)
      expect(res.json()).toMatchObject({ status: 'confirmed' })
    })

    it('returns 202 with a pending transaction for amounts > 50 000', async () => {
      const pending = aTransaction({ status: 'pending', amount: 60_000 })
      useCases.createTransaction.execute.mockResolvedValue(pending)

      const res = await app.inject({
        method:  'POST',
        url:     '/transactions',
        payload: { ...validBody, amount: 60_000 },
      })

      expect(res.statusCode).toBe(202)
      expect(res.json()).toMatchObject({ status: 'pending' })
    })
  })

  // ── PATCH /transactions/:id/approve ─────────────────────────────────────

  describe('PATCH /transactions/:id/approve', () => {
    it('returns 400 when id is not a valid UUID', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url:    '/transactions/not-a-uuid/approve',
      })

      expect(res.statusCode).toBe(400)
    })

    it('returns 404 when the transaction does not exist', async () => {
      useCases.approveTransaction.execute.mockRejectedValue(new TransactionNotFoundError(TX.id))

      const res = await app.inject({
        method: 'PATCH',
        url:    `/transactions/${TX.id}/approve`,
      })

      expect(res.statusCode).toBe(404)
      expect(res.json()).toMatchObject({ error: 'TRANSACTION_NOT_FOUND' })
    })

    it('returns 409 when the transaction is not in pending status', async () => {
      useCases.approveTransaction.execute.mockRejectedValue(new TransactionNotPendingError())

      const res = await app.inject({
        method: 'PATCH',
        url:    `/transactions/${TX.id}/approve`,
      })

      expect(res.statusCode).toBe(409)
      expect(res.json()).toMatchObject({ error: 'TRANSACTION_NOT_PENDING' })
    })

    it('returns 200 with the confirmed transaction', async () => {
      const confirmed = aTransaction({ status: 'confirmed' })
      useCases.approveTransaction.execute.mockResolvedValue(confirmed)

      const res = await app.inject({
        method: 'PATCH',
        url:    `/transactions/${TX_PEND.id}/approve`,
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({ status: 'confirmed' })
    })
  })

  // ── PATCH /transactions/:id/reject ───────────────────────────────────────

  describe('PATCH /transactions/:id/reject', () => {
    it('returns 404 when the transaction does not exist', async () => {
      useCases.rejectTransaction.execute.mockRejectedValue(new TransactionNotFoundError(TX.id))

      const res = await app.inject({
        method:  'PATCH',
        url:     `/transactions/${TX.id}/reject`,
        payload: {},
      })

      expect(res.statusCode).toBe(404)
      expect(res.json()).toMatchObject({ error: 'TRANSACTION_NOT_FOUND' })
    })

    it('returns 409 when the transaction is not in pending status', async () => {
      useCases.rejectTransaction.execute.mockRejectedValue(new TransactionNotPendingError())

      const res = await app.inject({
        method:  'PATCH',
        url:     `/transactions/${TX.id}/reject`,
        payload: {},
      })

      expect(res.statusCode).toBe(409)
      expect(res.json()).toMatchObject({ error: 'TRANSACTION_NOT_PENDING' })
    })

    it('returns 200 with the rejected transaction (no reason)', async () => {
      const rejected = aTransaction({ status: 'rejected' })
      useCases.rejectTransaction.execute.mockResolvedValue(rejected)

      const res = await app.inject({
        method:  'PATCH',
        url:     `/transactions/${TX_PEND.id}/reject`,
        payload: {},
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({ status: 'rejected' })
    })

    it('returns 200 with the rejected transaction (with reason)', async () => {
      const rejected = aTransaction({ status: 'rejected' })
      useCases.rejectTransaction.execute.mockResolvedValue(rejected)

      const res = await app.inject({
        method:  'PATCH',
        url:     `/transactions/${TX_PEND.id}/reject`,
        payload: { reason: 'Suspicious activity' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({ status: 'rejected' })
    })
  })
})
