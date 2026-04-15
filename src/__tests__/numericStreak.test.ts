import { describe, it, expect } from 'vitest'
import { meetsThreshold } from '../utils.js'

describe('meetsThreshold', () => {
  it('returns true when value equals threshold', () => {
    expect(meetsThreshold(10, 10)).toBe(true)
  })

  it('returns true when value exceeds threshold', () => {
    expect(meetsThreshold(45, 10)).toBe(true)
  })

  it('returns false when value is below threshold', () => {
    expect(meetsThreshold(9, 10)).toBe(false)
  })

  it('returns false for null value', () => {
    expect(meetsThreshold(null, 10)).toBe(false)
  })

  it('returns false for undefined value', () => {
    expect(meetsThreshold(undefined, 10)).toBe(false)
  })

  it('handles threshold of 0 (default for range starting at 0)', () => {
    expect(meetsThreshold(0, 0)).toBe(true)
    expect(meetsThreshold(1, 0)).toBe(true)
  })

  it('handles negative values and thresholds', () => {
    expect(meetsThreshold(-5, -10)).toBe(true)
    expect(meetsThreshold(-15, -10)).toBe(false)
  })
})
