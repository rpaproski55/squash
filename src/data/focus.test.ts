import { describe, expect, it } from 'vitest'
import { FOCUS_AREAS, LOSS_REASONS } from '../content/focus'
import type { DrillResult, Match } from './db'
import { focusList } from './focus'

const DAY = 24 * 60 * 60 * 1000
const NOW = 100 * DAY
const match = (daysAgo: number, reasons: string[], other?: string): Match => ({ at: NOW - daysAgo * DAY, result: 'loss', reasons, other })
const score = (daysAgo: number, value: number, side: 'forehand' | 'backhand' = 'forehand'): DrillResult => ({ drillId: 'drive-streak', side, score: value, at: NOW - daysAgo * DAY })
const ids = (list: ReturnType<typeof focusList>) => list.map((i) => i.area.id)

describe('content', () => {
  it('every loss reason raises a known focus area, each area once', () => {
    expect(LOSS_REASONS).toHaveLength(8)
    for (const r of LOSS_REASONS) expect(FOCUS_AREAS.some((a) => a.id === r.areaId)).toBe(true)
    expect(new Set(LOSS_REASONS.map((r) => r.areaId)).size).toBe(8)
  })
})

describe('focus list (PRODUCT_BRIEF section 10)', () => {
  it('a new player with nothing logged is told to start with the straight drive', () => {
    const list = focusList({ matches: [], results: [], level: null, now: NOW })
    expect(ids(list)).toEqual(['straight-drive'])
    expect(list[0].rule).toBe('stale')
  })

  it('loss reasons from the last three matches come first; a reason picked twice goes first', () => {
    const matches = [match(1, ['t']), match(3, ['front', 'tin']), match(5, ['front'])]
    const list = focusList({ matches, results: [score(1, 20)], level: null, now: NOW })
    expect(ids(list)).toEqual(['front-court', 'movement-t', 'consistency'])
    expect(list[0].reason).toContain('2 of your last 3 matches')
    expect(list[1].reason).toContain('your last match')
  })

  it('says "both" when every recent match picked it', () => {
    const list = focusList({ matches: [match(1, ['front']), match(2, ['front'])], results: [score(1, 20)], level: null, now: NOW })
    expect(list[0].reason).toBe('You picked “Beaten at the front” in both your last two matches')
  })

  it('only the last three matches count', () => {
    const matches = [match(1, []), match(2, []), match(3, []), match(4, ['energy'])]
    expect(ids(focusList({ matches, results: [score(1, 20)], level: null, now: NOW }))).not.toContain('fitness')
  })

  it('"Other" free text never raises a focus item', () => {
    const list = focusList({ matches: [match(1, [], 'Bad shoes')], results: [score(1, 20)], level: null, now: NOW })
    expect(ids(list)).toEqual(['straight-drive'])
    expect(list[0].rule).toBe('keep')
  })

  it('a drill below the level target comes after match reasons', () => {
    const results = [score(1, 8), score(2, 9), score(3, 10), score(1, 20, 'backhand')]
    const list = focusList({ matches: [match(1, ['t'])], results, level: '3.5', now: NOW })
    expect(ids(list)).toEqual(['movement-t', 'straight-drive'])
    expect(list[1].rule).toBe('drill')
    expect(list[1].reason).toBe('Typical forehand drive streak is 9; the 3.5 target is 15')
  })

  it('without a chosen level the drill rule does not apply', () => {
    const list = focusList({ matches: [], results: [score(1, 2)], level: null, now: NOW })
    expect(list[0].rule).toBe('keep')
  })

  it('a skill not practised in 14 days comes back', () => {
    const list = focusList({ matches: [], results: [score(20, 30)], level: '3.5', now: NOW })
    expect(list[0].reason).toBe('Not practised in 20 days')
    expect(focusList({ matches: [], results: [score(13, 30)], level: '3.5', now: NOW })[0].rule).toBe('keep')
  })

  it('a skill already listed is not repeated, and the list holds at most three', () => {
    const matches = [match(1, ['length', 't', 'front']), match(2, ['energy', 'serve'])]
    const list = focusList({ matches, results: [score(30, 1)], level: '3.5', now: NOW })
    expect(list).toHaveLength(3)
    expect(new Set(ids(list)).size).toBe(3)
    expect(list.filter((i) => i.area.id === 'straight-drive')).toHaveLength(1)
  })
})
