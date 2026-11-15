import { useLiveQuery } from 'dexie-react-hooks'
import type { LevelId } from '../content/types'
import { db, setPlayerLevel, type DrillResult } from './db'

const EMPTY: DrillResult[] = []

export function useDrillResults(drillId: string): DrillResult[] {
  return useLiveQuery(() => db.drillResults.where('drillId').equals(drillId).sortBy('at'), [drillId]) ?? EMPTY
}

export function usePlayerLevel(): [LevelId | null, (l: LevelId | null) => Promise<void>, boolean] {
  const row = useLiveQuery(() => db.settings.get('level').then((r) => r ?? { key: 'level', value: null }), [])
  return [(row?.value as LevelId | null) ?? null, setPlayerLevel, row !== undefined]
}
