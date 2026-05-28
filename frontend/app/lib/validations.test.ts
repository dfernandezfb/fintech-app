import { describe, expect, it } from 'vitest'
import { ValidationError } from 'yup'
import { createTransactionSchema, extractFieldErrors, rejectTransactionSchema } from './validations'

const FROM = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const TO   = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'

// ── createTransactionSchema ─────────────────────────────────────────────────

describe('createTransactionSchema', () => {
  describe('valid input', () => {
    it('passes with all required fields present', async () => {
      await expect(
        createTransactionSchema.validate({ fromUserId: FROM, toUserId: TO, amount: 500 })
      ).resolves.toBeDefined()
    })

    it('passes with a large amount (pending path)', async () => {
      await expect(
        createTransactionSchema.validate({ fromUserId: FROM, toUserId: TO, amount: 99_999 })
      ).resolves.toBeDefined()
    })
  })

  describe('fromUserId', () => {
    it('fails when fromUserId is missing', async () => {
      await expect(
        createTransactionSchema.validate({ toUserId: TO, amount: 100 }, { abortEarly: true })
      ).rejects.toThrow(ValidationError)
    })

    it('fails when fromUserId is an empty string', async () => {
      await expect(
        createTransactionSchema.validate({ fromUserId: '', toUserId: TO, amount: 100 })
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('toUserId', () => {
    it('fails when toUserId is missing', async () => {
      await expect(
        createTransactionSchema.validate({ fromUserId: FROM, amount: 100 }, { abortEarly: true })
      ).rejects.toThrow(ValidationError)
    })

    it('fails when sender and receiver are the same user', async () => {
      const err = await createTransactionSchema
        .validate({ fromUserId: FROM, toUserId: FROM, amount: 100 })
        .catch((e) => e)

      expect(err).toBeInstanceOf(ValidationError)
      expect((err as ValidationError).message).toMatch(/diferentes/)
    })
  })

  describe('amount', () => {
    it('fails when amount is missing', async () => {
      await expect(
        createTransactionSchema.validate({ fromUserId: FROM, toUserId: TO }, { abortEarly: true })
      ).rejects.toThrow(ValidationError)
    })

    it('fails when amount is 0', async () => {
      await expect(
        createTransactionSchema.validate({ fromUserId: FROM, toUserId: TO, amount: 0 })
      ).rejects.toThrow(ValidationError)
    })

    it('fails when amount is negative', async () => {
      await expect(
        createTransactionSchema.validate({ fromUserId: FROM, toUserId: TO, amount: -100 })
      ).rejects.toThrow(ValidationError)
    })

    it('fails when amount is a non-numeric string', async () => {
      await expect(
        createTransactionSchema.validate({ fromUserId: FROM, toUserId: TO, amount: 'abc' as any })
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('abortEarly: false collects all errors', () => {
    it('returns errors for all invalid fields at once', async () => {
      const err = await createTransactionSchema
        .validate({ fromUserId: '', toUserId: '', amount: 0 }, { abortEarly: false })
        .catch((e) => e) as ValidationError

      const fields = extractFieldErrors(err)
      expect(Object.keys(fields)).toContain('fromUserId')
      expect(Object.keys(fields)).toContain('amount')
    })
  })
})

// ── rejectTransactionSchema ─────────────────────────────────────────────────

describe('rejectTransactionSchema', () => {
  it('passes when reason is a non-empty string', async () => {
    const result = await rejectTransactionSchema.validate({ reason: 'Suspicious activity' })
    expect(result.reason).toBe('Suspicious activity')
  })

  it('passes when reason is omitted (defaults to empty string)', async () => {
    const result = await rejectTransactionSchema.validate({})
    expect(result.reason).toBe('')
  })

  it('trims whitespace from the reason', async () => {
    const result = await rejectTransactionSchema.validate({ reason: '  fraud  ' })
    expect(result.reason).toBe('fraud')
  })

  it('passes when reason is an empty string', async () => {
    await expect(
      rejectTransactionSchema.validate({ reason: '' })
    ).resolves.toBeDefined()
  })
})

// ── extractFieldErrors ──────────────────────────────────────────────────────

describe('extractFieldErrors', () => {
  it('converts a multi-field ValidationError into a flat error map', async () => {
    const err = await createTransactionSchema
      .validate(
        { fromUserId: '', toUserId: '', amount: -1 },
        { abortEarly: false },
      )
      .catch((e) => e) as ValidationError

    const fields = extractFieldErrors(err)

    expect(fields).toHaveProperty('fromUserId')
    expect(fields).toHaveProperty('amount')
    expect(typeof fields.fromUserId).toBe('string')
  })

  it('does not repeat the same field twice', async () => {
    const err = await createTransactionSchema
      .validate({ fromUserId: '', toUserId: TO, amount: 0 }, { abortEarly: false })
      .catch((e) => e) as ValidationError

    const fields = extractFieldErrors(err)
    const keys   = Object.keys(fields)

    expect(new Set(keys).size).toBe(keys.length)
  })

  it('handles a single-error ValidationError (abortEarly:true)', async () => {
    const err = await createTransactionSchema
      .validate({ fromUserId: '', toUserId: TO, amount: 100 }, { abortEarly: true })
      .catch((e) => e) as ValidationError

    const fields = extractFieldErrors(err)

    expect(Object.keys(fields).length).toBeGreaterThanOrEqual(1)
  })
})
