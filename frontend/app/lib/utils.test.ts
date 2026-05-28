import { describe, expect, it } from 'vitest'
import { formatAmount, formatDate, truncateId } from './utils'

// ── formatAmount ────────────────────────────────────────────────────────────
//
// Intl.NumberFormat output varies by the ICU data available in the runtime
// (e.g. Node.js with small-icu may use the OS locale even when 'en-US' is
// requested). Tests therefore assert structural properties — dollar sign,
// exact digit sequence — rather than locale-specific separator style.

/** Strip everything except digits so we can test the numeric content. */
const digitsOnly = (s: string) => s.replace(/\D/g, '')

describe('formatAmount', () => {
  it('always contains a dollar sign', () => {
    expect(formatAmount(1000)).toContain('$')
    expect(formatAmount(0)).toContain('$')
    expect(formatAmount(0.5)).toContain('$')
  })

  it('always ends with exactly two cents digits', () => {
    expect(digitsOnly(formatAmount(1000))).toMatch(/00$/)
    expect(digitsOnly(formatAmount(1234.56))).toMatch(/56$/)
    expect(digitsOnly(formatAmount(0.5))).toMatch(/50$/)
  })

  it('contains the full integer digits of the amount', () => {
    expect(digitsOnly(formatAmount(1234))).toContain('1234')
    expect(digitsOnly(formatAmount(1_000_000))).toContain('1000000')
  })

  it('rounds to two decimal places (9.999 → 10.00)', () => {
    // After rounding: 10.00 → digit string is "1000"
    expect(digitsOnly(formatAmount(9.999))).toBe('1000')
  })

  it('formats zero with two decimal places', () => {
    expect(digitsOnly(formatAmount(0))).toBe('000')
  })
})

// ── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns a non-empty string for a valid ISO date string', () => {
    const result = formatDate('2024-03-15T10:30:00.000Z')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('includes the year in the formatted output', () => {
    expect(formatDate('2024-03-15T10:30:00.000Z')).toContain('2024')
  })

  it('includes the day in the formatted output', () => {
    expect(formatDate('2024-03-15T10:30:00.000Z')).toContain('15')
  })

  it('produces different outputs for different dates', () => {
    const date1 = formatDate('2024-01-01T00:00:00.000Z')
    const date2 = formatDate('2024-12-31T23:59:00.000Z')
    expect(date1).not.toBe(date2)
  })
})

// ── truncateId ──────────────────────────────────────────────────────────────

describe('truncateId', () => {
  it('takes the first 8 characters and appends an ellipsis', () => {
    expect(truncateId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe('a0eebc99…')
  })

  it('works with any string of 8+ characters', () => {
    expect(truncateId('abcdefghijklmn')).toBe('abcdefgh…')
  })

  it('uses a Unicode ellipsis (…), not three dots (...)', () => {
    const result = truncateId('a0eebc99-9c0b-4ef8')
    expect(result).toContain('…')
    expect(result).not.toContain('...')
  })
})
