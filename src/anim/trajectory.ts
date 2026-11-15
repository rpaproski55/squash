import type { BallPoint, PlayerKey, Scene } from './types'

export interface Vec3 { x: number; y: number; z: number }

function segmentIndex(points: { t: number }[], t: number): number {
  // Last index i with points[i].t <= t, clamped so i+1 exists.
  let i = 0
  while (i < points.length - 2 && points[i + 1].t <= t) i++
  return i
}

/**
 * Ball position at time t. Segments are ballistic arcs under the scene's
 * gravity (x and y linear), except segments ending in a 'roll' point, which
 * run along the floor. Returns null before the first point.
 */
export function ballAt(points: BallPoint[], t: number, gravity: number): Vec3 | null {
  if (points.length === 0 || t < points[0].t) return null
  const last = points[points.length - 1]
  if (t >= last.t) return { x: last.x, y: last.y, z: last.z }
  const i = segmentIndex(points, t)
  const a = points[i]
  const b = points[i + 1]
  const T = b.t - a.t
  const s = t - a.t
  const k = T === 0 ? 1 : s / T
  const x = a.x + (b.x - a.x) * k
  const y = a.y + (b.y - a.y) * k
  if (b.event === 'roll' || T === 0) return { x, y, z: a.z + (b.z - a.z) * k }
  const vz = (b.z - a.z + 0.5 * gravity * T * T) / T
  const z = a.z + vz * s - 0.5 * gravity * s * s
  return { x, y, z }
}

/** Sampled ball positions between t0 and t1 (inclusive), for trails and paths. */
export function samplePath(points: BallPoint[], gravity: number, t0: number, t1: number, step = 1 / 60): Vec3[] {
  const out: Vec3[] = []
  const start = Math.max(t0, points[0]?.t ?? 0)
  for (let t = start; t < t1; t += step) {
    const p = ballAt(points, t, gravity)
    if (p) out.push(p)
  }
  const end = ballAt(points, t1, gravity)
  if (end) out.push(end)
  return out
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)

/** Player position at time t, eased between keyframes. */
export function playerAt(keys: PlayerKey[], t: number): { x: number; y: number } {
  if (t <= keys[0].t) return { x: keys[0].x, y: keys[0].y }
  const last = keys[keys.length - 1]
  if (t >= last.t) return { x: last.x, y: last.y }
  const i = segmentIndex(keys, t)
  const a = keys[i]
  const b = keys[i + 1]
  const k = ease((t - a.t) / (b.t - a.t))
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
}

/** Progress of a swing around its peak keyframe: -1 (backswing) .. 0 (contact) .. 1 (follow-through), or null. */
export function swingAt(keys: PlayerKey[], t: number, window = 0.35): { side: 'forehand' | 'backhand'; phase: number } | null {
  for (const k of keys) {
    if (k.swing && Math.abs(t - k.t) <= window) return { side: k.swing, phase: (t - k.t) / window }
  }
  return null
}

/** The caption showing at time t. */
export function captionAt(scene: Scene, t: number) {
  let current = null
  for (const c of scene.captions) if (c.t <= t) current = c
  return current
}

export function counterAt(scene: Scene, t: number) {
  let current = null
  for (const c of scene.counter ?? []) if (c.t <= t) current = c
  return current
}
