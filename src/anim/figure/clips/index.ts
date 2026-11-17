import type { FigureClip } from '../../types'
import { FOREHAND_DRIVE } from './forehandDrive'

export const CLIPS: Record<string, FigureClip> = {
  [FOREHAND_DRIVE.id]: FOREHAND_DRIVE,
}

export function getClip(id: string): FigureClip {
  const clip = CLIPS[id]
  if (!clip) throw new Error(`Unknown clip ${id}`)
  return clip
}

export { FOREHAND_DRIVE }
