import { useLiveQuery } from 'dexie-react-hooks'
import type { LevelId } from '../content/types'
import { db, setPlayerLevel, type DrillResult, type Match } from './db'
import { levelSuggestion, type Dismissal, type LevelSuggestion } from './levelSuggestion'

const EMPTY: DrillResult[] = []
const NO_MATCHES: Match[] = []

export function useDrillResults(drillId: string): DrillResult[] {
  return useLiveQuery(() => db.drillResults.where('drillId').equals(drillId).sortBy('at'), [drillId]) ?? EMPTY
}

export function usePlayerLevel(): [LevelId | null, (l: LevelId | null) => Promise<void>, boolean] {
  const row = useLiveQuery(() => db.settings.get('level').then((r) => r ?? { key: 'level', value: null }), [])
  return [(row?.value as LevelId | null) ?? null, setPlayerLevel, row !== undefined]
}

/** Every drill result, oldest first. */
export function useAllDrillResults(): DrillResult[] {
  return useLiveQuery(() => db.drillResults.orderBy('at').toArray(), []) ?? EMPTY
}

/** Every match, oldest first. */
export function useMatches(): Match[] {
  return useLiveQuery(() => db.matches.orderBy('at').toArray(), []) ?? NO_MATCHES
}

const DISMISS_KEY = 'levelSuggestionDismissed'

/** The level-change suggestion, if the evidence supports one and it was not dismissed lately. */
export function useLevelSuggestion(): { suggestion: LevelSuggestion | null; accept: () => Promise<void>; dismiss: () => Promise<void> } {
  const results = useAllDrillResults()
  const matches = useMatches()
  const [level] = usePlayerLevel()
  const dismissed = useLiveQuery(() => db.settings.get(DISMISS_KEY).then((r) => (r?.value as Dismissal | undefined) ?? null), [])
  const suggestion = dismissed === undefined ? null : levelSuggestion({ level, results, matches, dismissed, now: Date.now() })
  return {
    suggestion,
    accept: async () => { if (suggestion) await setPlayerLevel(suggestion.to) },
    dismiss: async () => { if (suggestion) await db.settings.put({ key: DISMISS_KEY, value: { to: suggestion.to, at: Date.now() } }) },
  }
}
