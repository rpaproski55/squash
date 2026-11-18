import { LOSS_REASONS, type LossReason } from '../content/focus'
import type { Match } from './db'

/*
 * Match trends for the Progress screen. Pure functions; the window size is
 * here so it is easy to change.
 */

/** Matches per window: "your last 5" compared with "the 5 before". */
export const MATCH_WINDOW = 5

export interface Record {
  wins: number
  losses: number
}

export function record(matches: Match[]): Record {
  const wins = matches.filter((m) => m.result === 'win').length
  return { wins, losses: matches.length - wins }
}

export const newestFirst = (matches: Match[]) => [...matches].sort((a, b) => b.at - a.at)

export interface ReasonTrend {
  reason: LossReason
  /** Picks in the last MATCH_WINDOW matches. */
  recent: number
  /** Picks in the MATCH_WINDOW matches before those (null if there were none). */
  before: number | null
  /** 'better' means picked less often than before. */
  direction: 'better' | 'worse' | 'same' | 'new'
}

/** Each loss reason picked in the recent window, most picked first. Reasons never picked recently are left out. */
export function reasonTrends(matches: Match[], window = MATCH_WINDOW): ReasonTrend[] {
  const sorted = newestFirst(matches)
  const recent = sorted.slice(0, window)
  const before = sorted.slice(window, window * 2)
  const count = (ms: Match[], id: string) => ms.filter((m) => m.reasons.includes(id)).length
  return LOSS_REASONS.map((reason) => {
    const r = count(recent, reason.id)
    const b = before.length ? count(before, reason.id) : null
    const direction: ReasonTrend['direction'] = b === null ? 'new' : r < b ? 'better' : r > b ? 'worse' : 'same'
    return { reason, recent: r, before: b, direction }
  })
    .filter((t) => t.recent > 0 || (t.before ?? 0) > 0)
    .sort((a, b) => b.recent - a.recent || (b.before ?? 0) - (a.before ?? 0))
}
