import { describe, expect, it } from 'vitest'
import { getDrill } from '../content/skills'
import type { DrillResult } from './db'
import { levelMet, median, nextTarget, summarise, trend, typicalScore } from './drillStats'

const drill = getDrill('drive-streak')!
// targets: 2.5:5, 3.0:10, 3.5:15, 4.0:25, 4.5:35, 5.0:50
const series = (scores: number[]): DrillResult[] =>
  scores.map((score, i) => ({ drillId: drill.id, side: 'forehand', score, at: 1000 + i }))

describe('median and typical score', () => {
  it('handles odd, even and empty lists', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBeNull()
  })

  it('uses recent sessions and ignores one lucky streak', () => {
    expect(typicalScore(series([2, 2, 2, 12, 13, 40, 14]))).toBe(13)
  })
})

describe('levelMet', () => {
  it('returns the highest target met', () => {
    expect(levelMet(drill, 4)).toBeNull()
    expect(levelMet(drill, 5)).toBe('2.5')
    expect(levelMet(drill, 16)).toBe('3.5')
    expect(levelMet(drill, 999)).toBe('5.0')
    expect(levelMet(drill, null)).toBeNull()
  })
})

describe('nextTarget', () => {
  it('without a level, chases the first target above the typical score', () => {
    expect(nextTarget(drill, null, null)).toEqual({ level: '2.5', target: 5 })
    expect(nextTarget(drill, 12, null)).toEqual({ level: '3.5', target: 15 })
  })

  it('with a level, starts at that level even if below it', () => {
    expect(nextTarget(drill, 3, '3.5')).toEqual({ level: '3.5', target: 15 })
    expect(nextTarget(drill, 15, '3.5')).toEqual({ level: '4.0', target: 25 })
  })

  it('returns null once every target is met', () => {
    expect(nextTarget(drill, 60, null)).toBeNull()
  })
})

describe('trend', () => {
  it('needs four sessions', () => {
    expect(trend(series([1, 2, 3]))).toBe('new')
  })
  it('detects up, down and flat', () => {
    expect(trend(series([5, 6, 5, 9, 10, 11]))).toBe('up')
    expect(trend(series([12, 12, 12, 6, 7, 8]))).toBe('down')
    expect(trend(series([10, 10, 10, 10, 10, 10]))).toBe('flat')
  })
})

describe('summarise', () => {
  it('summarises one side only', () => {
    const rows = [...series([8, 10, 12]), { drillId: drill.id, side: 'backhand' as const, score: 3, at: 5 }]
    const s = summarise(drill, rows, 'forehand', null)
    expect(s).toMatchObject({ count: 3, last: 12, best: 12, typical: 10, levelMet: '3.0', next: { level: '3.5', target: 15 } })
  })
})
