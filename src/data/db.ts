import Dexie, { type Table } from 'dexie'
import type { LevelId, Side } from '../content/types'

export interface DrillResult {
  id?: number
  drillId: string
  side: Side
  score: number
  /** Epoch milliseconds. */
  at: number
}

export interface Setting {
  key: string
  value: unknown
}

class SquashDB extends Dexie {
  drillResults!: Table<DrillResult, number>
  settings!: Table<Setting, string>

  constructor() {
    super('squash')
    this.version(1).stores({
      drillResults: '++id, drillId, [drillId+side], at',
      settings: 'key',
    })
  }
}

export const db = new SquashDB()

export async function logDrillScores(drillId: string, scores: Partial<Record<Side, number>>, at = Date.now()) {
  const rows: DrillResult[] = Object.entries(scores)
    .filter(([, v]) => typeof v === 'number')
    .map(([side, score]) => ({ drillId, side: side as Side, score: score as number, at }))
  return db.drillResults.bulkAdd(rows, { allKeys: true })
}

export async function deleteResults(ids: number[]) {
  await db.drillResults.bulkDelete(ids)
}

export async function getPlayerLevel(): Promise<LevelId | null> {
  const row = await db.settings.get('level')
  return (row?.value as LevelId | undefined) ?? null
}

export async function setPlayerLevel(level: LevelId | null) {
  await db.settings.put({ key: 'level', value: level })
}
