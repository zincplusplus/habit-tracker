import { describe, it, expect } from 'vitest'
import { matchesGroupFilter } from '../utils.js'

describe('matchesGroupFilter', () => {
  describe('no filter set', () => {
    it('returns true when neither groupFilter nor excludeFilter is set', () => {
      expect(matchesGroupFilter('morning', undefined, undefined)).toBe(true)
      expect(matchesGroupFilter(undefined, undefined, undefined)).toBe(true)
    })
  })

  describe('groupFilter (string)', () => {
    it('matches when habit group equals filter', () => {
      expect(matchesGroupFilter('morning', 'morning', undefined)).toBe(true)
    })

    it('does not match when habit group differs', () => {
      expect(matchesGroupFilter('evening', 'morning', undefined)).toBe(false)
    })

    it('does not match when habit has no group', () => {
      expect(matchesGroupFilter(undefined, 'morning', undefined)).toBe(false)
    })
  })

  describe('groupFilter (array)', () => {
    it('matches when habit group is any of the filter groups', () => {
      expect(matchesGroupFilter('health', ['morning', 'health'], undefined)).toBe(true)
    })

    it('does not match when habit group is in none of the filter groups', () => {
      expect(matchesGroupFilter('evening', ['morning', 'health'], undefined)).toBe(false)
    })
  })

  describe('habit group as array', () => {
    it('matches when one of the habit groups satisfies the filter', () => {
      expect(matchesGroupFilter(['morning', 'health'], 'health', undefined)).toBe(true)
    })

    it('does not match when none of the habit groups satisfy the filter', () => {
      expect(matchesGroupFilter(['morning', 'health'], 'evening', undefined)).toBe(false)
    })
  })

  describe('excludeFilter (string)', () => {
    it('excludes habit when its group matches the exclude filter', () => {
      expect(matchesGroupFilter('archived', undefined, 'archived')).toBe(false)
    })

    it('keeps habit when its group does not match the exclude filter', () => {
      expect(matchesGroupFilter('morning', undefined, 'archived')).toBe(true)
    })

    it('keeps habit with no group when exclude filter is set', () => {
      expect(matchesGroupFilter(undefined, undefined, 'archived')).toBe(true)
    })
  })

  describe('combined groupFilter + excludeFilter', () => {
    it('keeps habit that matches group and is not excluded', () => {
      expect(matchesGroupFilter('health', 'health', 'archived')).toBe(true)
    })

    it('excludes habit that matches group but is also in excludeGroup', () => {
      expect(matchesGroupFilter(['health', 'archived'], 'health', 'archived')).toBe(false)
    })

    it('excludes habit that does not match group even without exclude hit', () => {
      expect(matchesGroupFilter('morning', 'health', 'archived')).toBe(false)
    })
  })
})
