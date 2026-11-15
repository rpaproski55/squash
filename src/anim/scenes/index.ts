import type { SceneSet } from '../types'
import { DRIVE_STREAK, STRAIGHT_DRIVE } from './straightDrive'

export const SCENE_SETS: Record<string, SceneSet> = {
  [STRAIGHT_DRIVE.id]: STRAIGHT_DRIVE,
  [DRIVE_STREAK.id]: DRIVE_STREAK,
}

export function getSceneSet(id: string): SceneSet {
  const set = SCENE_SETS[id]
  if (!set) throw new Error(`Unknown scene ${id}`)
  return set
}
