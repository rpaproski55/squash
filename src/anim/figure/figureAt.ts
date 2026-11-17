import type { ClipPlacement, FigurePose, Player } from '../types'
import { getClip } from './clips'
import { blendChannels, placeFigure, sampleChannels, solveChannels } from './solve'

const smoothstep = (k: number) => k * k * (3 - 2 * k)

/** Scene-time window a placement plays: [at + from, at + to]. */
function windowOf(m: ClipPlacement): [number, number] {
  const clip = getClip(m.clip)
  return [m.at + (m.from ?? clip.start), m.at + (m.to ?? clip.end)]
}

function sampleAt(m: ClipPlacement, t: number) {
  const clip = getClip(m.clip)
  const tau = Math.min(m.to ?? clip.end, Math.max(m.from ?? clip.start, t - m.at))
  return sampleChannels(clip, tau)
}

/**
 * The solved figure for a player at scene time t, in court space, or null for a
 * player without motion. Inside a placement's window that placement plays.
 * Between two windows (a drill repeating the swing) the channels of the end of
 * one and the start of the next are blended before solving, with smoothstep
 * across the whole gap, so the figure steps back into its stance instead of
 * popping (DECISIONS.md, Step 6).
 */
export function figureAt(player: Player, t: number): FigurePose | null {
  const motion = player.motion
  if (!motion?.length) return null
  const ms = [...motion].sort((a, b) => a.at - b.at)
  for (let i = 0; i < ms.length; i++) {
    const [w0, w1] = windowOf(ms[i])
    const next = ms[i + 1]
    if (t <= w1 || !next) {
      // inside this window, before the first one, or after the last one
      return placeFigure(solveChannels(sampleAt(ms[i], t)), ms[i].anchor, ms[i].mirror)
    }
    const [n0] = windowOf(next)
    if (t < n0) {
      const k = smoothstep((t - w1) / (n0 - w1))
      const ch = blendChannels(sampleAt(ms[i], w1), sampleAt(next, n0), k)
      const anchor = { x: ms[i].anchor.x + (next.anchor.x - ms[i].anchor.x) * k, y: ms[i].anchor.y + (next.anchor.y - ms[i].anchor.y) * k }
      return placeFigure(solveChannels(ch), anchor, ms[i].mirror)
    }
    void w0
  }
  return null
}
