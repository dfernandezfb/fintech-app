import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { aUser, anotherUser } from '../../../../../application/use-cases/__tests__/fixtures'
import { buildMockControllers, buildTestApp } from './app.helper'

describe('GET /users', () => {
  let app:     FastifyInstance
  let useCases: ReturnType<typeof buildMockControllers>['useCases']

  beforeAll(async () => {
    const mocks = buildMockControllers()
    useCases    = mocks.useCases
    app         = await buildTestApp(mocks.userCtrl, mocks.txCtrl)
  })

  afterAll(() => app.close())

  beforeEach(() => {
    useCases.getUsers.execute.mockReset()
  })

  it('returns 200 with an empty array when there are no users', async () => {
    useCases.getUsers.execute.mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/users' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([])
  })

  it('returns 200 with the full user list', async () => {
    const users = [aUser(), anotherUser()]
    useCases.getUsers.execute.mockResolvedValue(users)

    const res = await app.inject({ method: 'GET', url: '/users' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveLength(2)
    expect(body[0].id).toBe(aUser().id)
    expect(body[1].id).toBe(anotherUser().id)
  })

  it('returns 500 when the use case throws an unexpected error', async () => {
    useCases.getUsers.execute.mockRejectedValue(new Error('DB connection lost'))

    const res = await app.inject({ method: 'GET', url: '/users' })

    expect(res.statusCode).toBe(500)
    expect(res.json()).toMatchObject({ error: 'INTERNAL_SERVER_ERROR' })
  })
})
