import { FOCUS_AREAS, getLossReason, type FocusArea } from '../content/focus'
import { DRILLS } from '../content/skills'
import type { LevelId, Side } from '../content/types'
import type { DrillResult, Match } from './db'
import { summarise } from './drillStats'

/*
 * "What do I work on today?" The home screen's one to three focus items, from
 * the priority in docs/PRODUCT_BRIEF.md, section 10:
 *
 *   1. Loss reasons picked in the last three matches (a reason picked twice
 *      puts its skill first).
 *   2. Drills where the typical score is below the player's level target.
 *   3. Skills not practised in 14 days.
 *
 * Pure: the caller passes the data and the time.
 */

export const FOCUS_RULES = {
  /** How many recent matches the loss reasons come from. */
  recentMatches: 3,
  /** A skill with a drill counts as stale after this many days without a logged score. */
  staleDays: 14,
  maxItems: 3,
} as const

export type FocusRule = 'matches' | 'drill' | 'stale' | 'keep'

export interface FocusItem {
  area: FocusArea
  /** One line saying why this is on the list. */
  reason: string
  rule: FocusRule
}

const DAY = 24 * 60 * 60 * 1000
const SIDE: Record<Side, string> = { forehand: 'forehand', backhand: 'backhand' }

export function focusList({ matches, results, level, now }: { matches: Match[]; results: DrillResult[]; level: LevelId | null; now: number }): FocusItem[] {
  const items: FocusItem[] = []
  const has = (areaId: string) => items.some((i) => i.area.id === areaId)
  const push = (area: FocusArea | undefined, reason: string, rule: FocusRule) => {
    if (area && !has(area.id)) items.push({ area, reason, rule })
  }

  // 1. Loss reasons from the last three matches. More picks first, then the most recent.
  const recent = [...matches].sort((a, b) => b.at - a.at).slice(0, FOCUS_RULES.recentMatches)
  const picks = new Map<string, { count: number; latest: number }>() // reason id -> picks, index of latest match (0 = newest)
  recent.forEach((m, i) => {
    for (const id of new Set(m.reasons)) {
      if (!getLossReason(id)) continue
      const p = picks.get(id) ?? { count: 0, latest: i }
      picks.set(id, { count: p.count + 1, latest: Math.min(p.latest, i) })
    }
  })
  const ranked = [...picks.entries()].sort((a, b) => b[1].count - a[1].count || a[1].latest - b[1].latest)
  for (const [id, { count, latest }] of ranked) {
    const r = getLossReason(id)!
    const reason =
      count > 1 && count === recent.length ? `You picked “${r.label}” in ${count === 2 ? 'both your last two' : `all your last ${count}`} matches`
      : count > 1 ? `You picked “${r.label}” in ${count} of your last ${recent.length} matches`
      : latest === 0 ? `You picked “${r.label}” in your last match`
      : `You picked “${r.label}” in a recent match`
    push(FOCUS_AREAS.find((a) => a.id === r.areaId), reason, 'matches')
  }

  // 2. Drills below the player's level target (needs a chosen level).
  if (level) {
    for (const drill of DRILLS) {
      const target = drill.targets[level]
      if (target === undefined) continue
      const below = drill.sides
        .map((side) => ({ side, typical: summarise(drill, results, side, level).typical }))
        .filter((s): s is { side: Side; typical: number } => s.typical !== null && s.typical < target)
        .sort((a, b) => a.typical - b.typical)[0]
      if (below)
        push(
          FOCUS_AREAS.find((a) => a.skillId === drill.skillId),
          `Typical ${SIDE[below.side]} ${drill.name.toLowerCase()} is ${below.typical}; the ${level} target is ${target}`,
          'drill',
        )
    }
  }

  // 3. Skills with a drill that has not been practised in 14 days.
  for (const area of FOCUS_AREAS) {
    const drills = DRILLS.filter((d) => d.skillId === area.skillId)
    if (!area.skillId || !drills.length) continue
    const last = Math.max(-Infinity, ...results.filter((r) => drills.some((d) => d.id === r.drillId)).map((r) => r.at))
    if (last === -Infinity) push(area, 'Not practised yet: log a first score to set your baseline', 'stale')
    else if (now - last > FOCUS_RULES.staleDays * DAY) push(area, `Not practised in ${Math.floor((now - last) / DAY)} days`, 'stale')
  }

  // Nothing flagged: keep the core shot sharp, so the list is never empty.
  if (!items.length) push(FOCUS_AREAS[0], 'Nothing flagged: on target and practised lately. Keep it sharp', 'keep')

  return items.slice(0, FOCUS_RULES.maxItems)
}
