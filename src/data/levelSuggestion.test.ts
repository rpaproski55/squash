import { describe, expect, it } from 'vitest'
import type { DrillResult, Match } from './db'
import { LEVEL_RULES, levelSuggestion } from './levelSuggestion'

// drive-streak targets: 2.5:5, 3.0:10, 3.5:15, 4.0:25, 4.5:35, 5.0:50
const DAY = 24 * 60 * 60 * 1000
const NOW = 100 * DAY
const scores = (fh: number[], bh: number[] = fh): DrillResult[] => [
  ...fh.map((score, i) => ({ drillId: 'drive-streak', side: 'forehand' as const, score, at: NOW - (10 - i) * DAY })),
  ...bh.map((score, i) => ({ drillId: 'drive-streak', side: 'backhand' as const, score, at: NOW - (10 - i) * DAY })),
]
const games = (results: ('win' | 'loss')[], opponent: Match['opponent'] = 'similar'): Match[] =>
  results.map((result, i) => ({ at: NOW - i * DAY, result, opponent, reasons: [] }))
const run = (args: Partial<Parameters<typeof levelSuggestion>[0]>) =>
  levelSuggestion({ level: '3.5', results: [], matches: [], now: NOW, ...args })

describe('level-change suggestion (PRODUCT_BRIEF section 10)', () => {
  it('suggests moving up when drills meet the next target and most similar matches are won', () => {
    const s = run({ results: scores([26, 27, 25]), matches: games(['win', 'win', 'loss']) })
    expect(s).toMatchObject({ kind: 'up', from: '3.5', to: '4.0' })
    expect(s!.because[1]).toBe('Won 2 of your last 3 matches against similar opponents')
  })

  it('needs both: good drills with losing matches is no suggestion, and so is winning with weak drills', () => {
    expect(run({ results: scores([26, 27, 25]), matches: games(['loss', 'loss', 'win']) })).toBeNull()
    expect(run({ results: scores([16, 17, 18]), matches: games(['win', 'win', 'win']) })).toBeNull()
  })

  it('every measured side must meet the target', () => {
    expect(run({ results: scores([26, 27, 25], [20, 20, 20]), matches: games(['win', 'win', 'win']) })).toBeNull()
  })

  it('needs enough evidence: sessions per side and matches against similar opponents', () => {
    expect(run({ results: scores([26, 27]), matches: games(['win', 'win', 'win']) })).toBeNull()
    expect(run({ results: scores([26, 27, 25]), matches: games(['win', 'win']) })).toBeNull()
    expect(run({ results: scores([26, 27, 25]), matches: games(['win', 'win', 'win'], 'weaker') })).toBeNull()
  })

  it('only the most recent similar matches count', () => {
    const old = games(['loss', 'loss', 'loss', 'loss', 'loss']).map((m) => ({ ...m, at: m.at - 50 * DAY }))
    const recent = games(['win', 'win', 'win', 'win', 'loss'])
    expect(run({ results: scores([26, 27, 25]), matches: [...old, ...recent] })?.kind).toBe('up')
    expect(LEVEL_RULES.recentMatches).toBe(5)
  })

  it('suggests moving down when drills are below the level beneath and most similar matches are lost', () => {
    const s = run({ results: scores([8, 9, 7]), matches: games(['loss', 'loss', 'win']) })
    expect(s).toMatchObject({ kind: 'down', from: '3.5', to: '3.0' })
  })

  it('without a level, offers the highest level the drill scores meet, matches not needed', () => {
    const s = run({ level: null, results: scores([16, 18, 17], [15, 16, 15]) })
    expect(s).toMatchObject({ kind: 'start', from: null, to: '3.5' })
    expect(run({ level: null, results: scores([2, 3, 2]) })).toBeNull()
  })

  it('"Not now" hides the same suggestion for 14 days, not a different one', () => {
    const args = { results: scores([26, 27, 25]), matches: games(['win', 'win', 'win']) }
    expect(run({ ...args, dismissed: { to: '4.0', at: NOW - 13 * DAY } })).toBeNull()
    expect(run({ ...args, dismissed: { to: '4.0', at: NOW - 15 * DAY } })?.to).toBe('4.0')
    expect(run({ ...args, dismissed: { to: '3.0', at: NOW - DAY } })?.to).toBe('4.0')
  })

  it('there is nothing above the top level', () => {
    expect(run({ level: '6.0', results: scores([90, 90, 90]), matches: games(['win', 'win', 'win']) })).toBeNull()
  })
})
