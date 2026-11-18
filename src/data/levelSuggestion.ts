import { LEVEL_IDS } from '../content/levels'
import { DRILLS } from '../content/skills'
import type { Drill, LevelId, Side } from '../content/types'
import type { DrillResult, Match } from './db'
import { seriesFor, typicalScore } from './drillStats'

/*
 * The level-change suggestion (docs/PRODUCT_BRIEF.md, section 10). Deliberately
 * loose: a clearly labelled suggestion, never automatic. All thresholds live
 * in LEVEL_RULES so they are easy to change after real use.
 *
 * Up:    drill scores meet the next level's targets, and the player wins most
 *        recent matches against similar opponents.
 * Down:  drill scores are below the level beneath's targets, and the player
 *        loses most recent matches against similar opponents.
 * Start: no level chosen, and drill scores meet a level's targets: offer it.
 */

export const LEVEL_RULES = {
  /** Sessions logged on a side before its typical score counts as evidence. */
  minDrillSessions: 3,
  /** How many recent matches against similar opponents to look at... */
  recentMatches: 5,
  /** ...and how many of them are needed before matches count at all. */
  minMatches: 3,
  /** Move up: win more than this share of them. */
  upWinShare: 0.5,
  /** Move down: lose more than this share of them. */
  downLossShare: 0.5,
  /** "Not now" hides the same suggestion for this many days. */
  dismissDays: 14,
} as const

export interface LevelSuggestion {
  kind: 'up' | 'down' | 'start'
  from: LevelId | null
  to: LevelId
  /** The evidence, one line each. */
  because: string[]
}

export interface Dismissal {
  to: LevelId
  at: number
}

const DAY = 24 * 60 * 60 * 1000

/** Typical score per side, only for sides with enough sessions. */
function measured(drill: Drill, results: DrillResult[]) {
  return drill.sides
    .map((side) => ({ side, series: seriesFor(results, drill.id, side) }))
    .filter((s) => s.series.length >= LEVEL_RULES.minDrillSessions)
    .map((s) => ({ side: s.side as Side, typical: typicalScore(s.series)! }))
}

/** Does every measured side of every drill with a target at `level` meet it (or fall short of it)? Null when nothing is measured. */
function drillsVs(level: LevelId, results: DrillResult[], test: 'meet' | 'below'): string | null {
  const lines: string[] = []
  let any = false
  for (const drill of DRILLS) {
    const target = drill.targets[level]
    if (target === undefined) continue
    const sides = measured(drill, results)
    if (!sides.length) continue
    any = true
    const ok = sides.every((s) => (test === 'meet' ? s.typical >= target : s.typical < target))
    if (!ok) return null
    const scores = sides.map((s) => `${s.side} ${s.typical}`).join(', ')
    lines.push(`${drill.name}: typical ${scores}; the ${level} target is ${target}`)
  }
  return any ? lines.join('. ') : null
}

/** Win and loss count over the recent matches against similar opponents, or null if too few. */
function similarRecord(matches: Match[]) {
  const recent = matches
    .filter((m) => m.opponent === 'similar')
    .sort((a, b) => b.at - a.at)
    .slice(0, LEVEL_RULES.recentMatches)
  if (recent.length < LEVEL_RULES.minMatches) return null
  const wins = recent.filter((m) => m.result === 'win').length
  return { wins, losses: recent.length - wins, n: recent.length }
}

export function levelSuggestion({ level, results, matches, dismissed, now }: {
  level: LevelId | null
  results: DrillResult[]
  matches: Match[]
  dismissed?: Dismissal | null
  now: number
}): LevelSuggestion | null {
  const s = suggest(level, results, matches)
  if (s && dismissed && dismissed.to === s.to && now - dismissed.at < LEVEL_RULES.dismissDays * DAY) return null
  return s
}

function suggest(level: LevelId | null, results: DrillResult[], matches: Match[]): LevelSuggestion | null {
  if (!level) {
    // Highest level whose drill targets the scores meet.
    const met = [...LEVEL_IDS].reverse().find((l) => drillsVs(l, results, 'meet'))
    return met ? { kind: 'start', from: null, to: met, because: [drillsVs(met, results, 'meet')!] } : null
  }
  const record = similarRecord(matches)
  if (!record) return null
  const i = LEVEL_IDS.indexOf(level)
  const up = LEVEL_IDS[i + 1]
  const down = LEVEL_IDS[i - 1]
  const games = (w: number, n: number, verb: string) => `${verb} ${w} of your last ${n} matches against similar opponents`

  if (up && record.wins / record.n > LEVEL_RULES.upWinShare) {
    const drills = drillsVs(up, results, 'meet')
    if (drills) return { kind: 'up', from: level, to: up, because: [drills, games(record.wins, record.n, 'Won')] }
  }
  if (down && record.losses / record.n > LEVEL_RULES.downLossShare) {
    const drills = drillsVs(down, results, 'below')
    if (drills) return { kind: 'down', from: level, to: down, because: [drills, games(record.losses, record.n, 'Lost')] }
  }
  return null
}

