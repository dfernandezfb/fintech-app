import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetUsersUseCase } from '../GetUsersUseCase'
import { aUser, anotherUser } from './fixtures'
import { mockUserRepo } from './mocks'

describe('GetUsersUseCase', () => {
  let userRepo: ReturnType<typeof mockUserRepo>
  let useCase:  GetUsersUseCase

  beforeEach(() => {
    userRepo = mockUserRepo()
    useCase  = new GetUsersUseCase(userRepo)
  })

  it('returns an empty array when there are no users', async () => {
    vi.mocked(userRepo.findAll).mockResolvedValue([])

    const result = await useCase.execute()

    expect(result).toEqual([])
  })

  it('returns all users from the repository', async () => {
    const users = [aUser(), anotherUser()]
    vi.mocked(userRepo.findAll).mockResolvedValue(users)

    const result = await useCase.execute()

    expect(result).toEqual(users)
  })

  it('delegates to userRepo.findAll()', async () => {
    vi.mocked(userRepo.findAll).mockResolvedValue([])

    await useCase.execute()

    expect(userRepo.findAll).toHaveBeenCalledOnce()
  })

  it('does not call findById', async () => {
    vi.mocked(userRepo.findAll).mockResolvedValue([aUser()])

    await useCase.execute()

    expect(userRepo.findById).not.toHaveBeenCalled()
  })
})
