import type { FigurePose, Player } from '../types'
import { getClip } from './clips'
import { placeFigure, solveFigure } from './solve'

/**
 * The solved figure for a player at scene time t, in court space, or null for a
 * player without motion. With several placements the nearest one in time plays
 * (blending between swings comes with the drill, PLAN.md step 6).
 */
export function figureAt(player: Player, t: number): FigurePose | null {
  const motion = player.motion
  if (!motion?.length) return null
  let best = motion[0]
  for (const m of motion) if (Math.abs(t - m.at) < Math.abs(t - best.at)) best = m
  const clip = getClip(best.clip)
  let tau = t - best.at
  tau = Math.min(best.to ?? clip.end, Math.max(best.from ?? clip.start, tau))
  return placeFigure(solveFigure(clip, tau), best.anchor, best.mirror)
}
