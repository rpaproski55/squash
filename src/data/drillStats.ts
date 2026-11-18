import { LEVEL_IDS, compareLevels } from '../content/levels'
import type { Drill, LevelId, Side } from '../content/types'
import type { DrillResult } from './db'

/*
 * Progress logic for countable drills. Pure functions so they can be tested
 * and reused by the home screen and the readiness view later.
 *
 * "Typical" uses the median of recent sessions rather than the best one, so a
 * single lucky streak does not move the player's level.
 */

export const RECENT_WINDOW = 5

export function seriesFor(results: DrillResult[], drillId: string, side: Side): DrillResult[] {
  return results.filter((r) => r.drillId === drillId && r.side === side).sort((a, b) => a.at - b.at)
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export function typicalScore(series: DrillResult[], window = RECENT_WINDOW): number | null {
  return median(series.slice(-window).map((r) => r.score))
}

export function personalBest(series: DrillResult[]): number | null {
  return series.length ? Math.max(...series.map((r) => r.score)) : null
}

/** Levels that have a target for this drill, in ladder order. */
export function targetLevels(drill: Drill): LevelId[] {
  return LEVEL_IDS.filter((l) => drill.targets[l] !== undefined)
}

/** Highest level whose target the score meets, or null if below every target. */
export function levelMet(drill: Drill, score: number | null): LevelId | null {
  if (score === null) return null
  let met: LevelId | null = null
  for (const l of targetLevels(drill)) if (score >= drill.targets[l]!) met = l
  return met
}

/**
 * The target to chase next. With a chosen level, it is that level's target
 * until met, then the next one up. Without a level, it is the first target
 * above the player's typical score.
 */
export function nextTarget(drill: Drill, typical: number | null, playerLevel: LevelId | null): { level: LevelId; target: number } | null {
  const levels = targetLevels(drill)
  const candidates = playerLevel ? levels.filter((l) => compareLevels(l, playerLevel) >= 0) : levels
  const pick = candidates.find((l) => typical === null || drill.targets[l]! > typical)
  if (!pick) return null
  return { level: pick, target: drill.targets[pick]! }
}

export type Trend = 'new' | 'up' | 'down' | 'flat'

/** Compare the last three sessions with the three before them. */
export function trend(series: DrillResult[], threshold = 0.1): Trend {
  if (series.length < 4) return 'new'
  const recent = median(series.slice(-3).map((r) => r.score))!
  const before = median(series.slice(-6, -3).map((r) => r.score))!
  const base = Math.max(before, 1)
  const change = (recent - before) / base
  if (change > threshold) return 'up'
  if (change < -threshold) return 'down'
  return 'flat'
}

export interface SideSummary {
  side: Side
  count: number
  last: number | null
  best: number | null
  typical: number | null
  trend: Trend
  levelMet: LevelId | null
  next: { level: LevelId; target: number } | null
}

export function summarise(drill: Drill, results: DrillResult[], side: Side, playerLevel: LevelId | null): SideSummary {
  const series = seriesFor(results, drill.id, side)
  const typical = typicalScore(series)
  return {
    side,
    count: series.length,
    last: series.at(-1)?.score ?? null,
    best: personalBest(series),
    typical,
    trend: trend(series),
    levelMet: levelMet(drill, typical),
    next: nextTarget(drill, typical, playerLevel),
  }
}
