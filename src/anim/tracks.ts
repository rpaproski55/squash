import type { Track, Vec3 } from './types'
import { V } from './vec'

/*
 * Track samplers, ported line for line from the prototype core block.
 * A track is [[t, value], ...] sorted by t.
 */

type Sampled = number | readonly number[]

/**
 * Monotone cubic per component (Fritsch-Carlson tangents, time weighted).
 * Smooth through keys, never overshoots, and two equal neighbouring keys give
 * an exact hold, so a foot key repeated at the start and end of a stance is a
 * guaranteed plant.
 */
export function sampleTrack<T extends Sampled>(track: Track<T>, t: number): T {
  const n = track.length
  if (t <= track[0][0]) return track[0][1]
  if (t >= track[n - 1][0]) return track[n - 1][1]
  let i = 0
  while (i < n - 2 && track[i + 1][0] <= t) i++
  const comp = (get: (j: number) => number): number => {
    const t0 = track[i][0], t1 = track[i + 1][0], h = t1 - t0
    const p0 = get(i), p1 = get(i + 1)
    const slope = (j: number): number => { // tangent at key j
      if (j === 0 || j === n - 1) return 0
      const a = (get(j) - get(j - 1)) / (track[j][0] - track[j - 1][0])
      const b = (get(j + 1) - get(j)) / (track[j + 1][0] - track[j][0])
      if (a * b <= 0) return 0
      const ha = track[j][0] - track[j - 1][0], hb = track[j + 1][0] - track[j][0]
      return (3 * (ha + hb)) / ((2 * hb + ha) / a + (hb + 2 * ha) / b) // weighted harmonic mean
    }
    const m0 = slope(i), m1 = slope(i + 1), k = (t - t0) / h, k2 = k * k, k3 = k2 * k
    return (2 * k3 - 3 * k2 + 1) * p0 + (k3 - 2 * k2 + k) * h * m0 + (-2 * k3 + 3 * k2) * p1 + (k3 - k2) * h * m1
  }
  const v = track[i][1]
  if (typeof v === 'number') return comp((j) => track[j][1] as number) as T
  return (v as readonly number[]).map((_, c) => comp((j) => (track[j][1] as readonly number[])[c])) as unknown as T
}

/**
 * Sample a track of unit vectors along great-circle arcs. The total angle
 * travelled is interpolated as one monotone cubic scalar and each segment is a
 * slerp, so angular speed is continuous. A key tagged 'peak' gets a tangent of
 * 1.5 times the faster neighbouring rate (capped at 3 times the slower), which
 * puts the fastest rotation on that key. Without it the racquet slows down as
 * it reaches the ball.
 */
export function sampleArc(track: Track<Vec3>, t: number): Vec3 {
  const n = track.length, u = (i: number) => V.norm(track[i][1])
  if (t <= track[0][0]) return u(0)
  if (t >= track[n - 1][0]) return u(n - 1)
  const ang = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, V.dot(a, b))))
  const cum = [0]
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + ang(u(i - 1), u(i)))
  let i = 0
  while (i < n - 2 && track[i + 1][0] <= t) i++
  const slope = (j: number): number => {
    if (j === 0 || j === n - 1) return 0
    const ha = track[j][0] - track[j - 1][0], hb = track[j + 1][0] - track[j][0]
    const a = (cum[j] - cum[j - 1]) / ha, b = (cum[j + 1] - cum[j]) / hb
    if (a <= 0 || b <= 0) return 0
    if (track[j][2] === 'peak') return Math.min(1.5 * Math.max(a, b), 3 * Math.min(a, b))
    return (3 * (ha + hb)) / ((2 * hb + ha) / a + (hb + 2 * ha) / b)
  }
  const t0 = track[i][0], h = track[i + 1][0] - t0, k = (t - t0) / h, k2 = k * k, k3 = k2 * k
  const th = (2 * k3 - 3 * k2 + 1) * cum[i] + (k3 - 2 * k2 + k) * h * slope(i) + (-2 * k3 + 3 * k2) * cum[i + 1] + (k3 - k2) * h * slope(i + 1)
  const seg = cum[i + 1] - cum[i]
  if (seg < 1e-6) return u(i)
  const f = Math.max(0, Math.min(1, (th - cum[i]) / seg)), a = u(i), b = u(i + 1), so = Math.sin(seg)
  if (so < 1e-6) return V.norm(V.lerp(a, b, f))
  return V.add(V.mul(a, Math.sin((1 - f) * seg) / so), V.mul(b, Math.sin(f * seg) / so))
}

/** Piecewise-linear sample (used for pace). */
export function sampleLinear(track: Track<number>, t: number): number {
  const n = track.length
  if (t <= track[0][0]) return track[0][1]
  if (t >= track[n - 1][0]) return track[n - 1][1]
  let i = 0
  while (i < n - 2 && track[i + 1][0] <= t) i++
  const k = (t - track[i][0]) / (track[i + 1][0] - track[i][0])
  return track[i][1] + (track[i + 1][1] - track[i][1]) * k
}
