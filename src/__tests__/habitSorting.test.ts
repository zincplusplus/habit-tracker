import { describe, it, expect } from 'vitest'
import { compareHabits } from '../utils.js'

const habit = (basename: string, order?: number) => ({
  file: { basename },
  order,
})

describe('compareHabits', () => {
  it('sorts by order ascending', () => {
    const a = habit('Zzz', 1)
    const b = habit('Aaa', 2)
    expect(compareHabits(a, b)).toBeLessThan(0)
  })

  it('habits without order fall after ordered habits', () => {
    const ordered = habit('Zzz', 1)
    const unordered = habit('Aaa', undefined)
    expect(compareHabits(ordered, unordered)).toBeLessThan(0)
    expect(compareHabits(unordered, ordered)).toBeGreaterThan(0)
  })

  it('uses alphabetical basename as tiebreaker when order is equal', () => {
    const a = habit('Apple', 1)
    const b = habit('Banana', 1)
    expect(compareHabits(a, b)).toBeLessThan(0)
    expect(compareHabits(b, a)).toBeGreaterThan(0)
  })

  it('two unordered habits sort alphabetically', () => {
    const a = habit('Apple')
    const b = habit('Banana')
    expect(compareHabits(a, b)).toBeLessThan(0)
  })

  it('returns 0 for identical order and basename', () => {
    const a = habit('Same', 1)
    const b = habit('Same', 1)
    expect(compareHabits(a, b)).toBe(0)
  })

  it('sorts an array of habits correctly', () => {
    const habits = [
      habit('Charlie', 3),
      habit('Alpha'),
      habit('Bravo', 1),
      habit('Delta'),
      habit('Echo', 2),
    ]
    const sorted = [...habits].sort(compareHabits)
    expect(sorted.map((h) => h.file.basename)).toEqual([
      'Bravo',
      'Echo',
      'Charlie',
      'Alpha',
      'Delta',
    ])
  })
})
