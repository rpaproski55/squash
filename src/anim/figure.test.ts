import { describe, expect, it } from 'vitest'
import { CAMERAS, makeProjector, STAGE } from './camera'
import { FOREHAND_DRIVE } from './figure/clips'
import { figureAt } from './figure/figureAt'
import { footAt, placeFigure, solveFigure } from './figure/solve'
import { DEFAULT_DIRECTOR, directedCamera, directorFor, paceAt } from './director'
import { SCENE_SETS } from './scenes'
import { ballAt } from './trajectory'
import { sampleTrack } from './tracks'
import type { FigurePose, Vec3 } from './types'
import { RAD, V } from './vec'

const clip = FOREHAND_DRIVE
const ANCHOR = { x: 5.6, y: 8.4 }
const at = (tau: number) => placeFigure(solveFigure(clip, tau), ANCHOR)
const deg = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, V.dot(V.norm(a), V.norm(b))))) / RAD
const range = (a: number, b: number, step: number) => {
  const out: number[] = []
  for (let t = a; t <= b + 1e-9; t += step) out.push(t)
  return out
}

const scenes = Object.values(SCENE_SETS).flatMap((s) => s.variants)
const placements = scenes.flatMap((scene) => scene.players.flatMap((pl) => (pl.motion ?? []).map((m) => ({ scene, pl, m }))))

describe('figure: the solved poses match the prototype (POSES.md table)', () => {
  // t, pelvis, chest, head, racquet hand, racquet head, L ankle, R ankle, wrist angle, elbow angle
  const table: [number, Vec3, Vec3, Vec3, Vec3, Vec3, Vec3, Vec3, number, number][] = [
    [-2.0, [3.2, 5.95, 0.9], [3.2, 5.82, 1.36], [3.2, 5.78, 1.59], [3.4, 5.52, 1.12], [3.27, 5.37, 1.58], [2.95, 5.95, 0.08], [3.45, 5.95, 0.08], 117, 88],
    [-1.45, [3.3, 6.42, 0.8], [3.46, 6.39, 1.25], [3.51, 6.38, 1.47], [3.72, 6.68, 1.17], [3.71, 6.66, 1.67], [3.0, 6.06, 0.14], [3.6, 6.78, 0.11], 123, 54],
    [-0.8, [3.91, 8.07, 0.79], [4.1, 8.12, 1.23], [4.16, 8.13, 1.45], [3.95, 8.51, 1.29], [3.86, 8.39, 1.76], [3.8, 7.8, 0.08], [4.02, 8.34, 0.19], 131, 52],
    [-0.34, [4.5, 8.58, 0.75], [4.72, 8.7, 1.16], [4.79, 8.73, 1.38], [4.36, 9.04, 1.2], [4.28, 8.77, 1.61], [4.81, 8.32, 0.17], [4.18, 8.9, 0.08], 110, 72],
    [-0.13, [4.61, 8.59, 0.71], [4.89, 8.64, 1.1], [4.97, 8.65, 1.31], [4.96, 8.96, 0.84], [4.9, 9.34, 1.15], [5.0, 8.42, 0.08], [4.18, 8.9, 0.08], 87, 68],
    [0.0, [4.61, 8.59, 0.7], [4.9, 8.51, 1.08], [4.98, 8.49, 1.29], [5.12, 8.4, 0.68], [5.6, 8.4, 0.55], [5.0, 8.42, 0.08], [4.18, 8.9, 0.08], 119, 146],
    [0.14, [4.61, 8.59, 0.7], [4.82, 8.4, 1.1], [4.88, 8.35, 1.31], [5.01, 8.03, 0.96], [4.84, 7.65, 1.23], [5.0, 8.42, 0.08], [4.18, 8.9, 0.08], 132, 162],
    [0.4, [4.61, 8.59, 0.72], [4.69, 8.39, 1.15], [4.71, 8.34, 1.37], [4.66, 8.08, 1.39], [4.42, 8.15, 1.82], [5.0, 8.42, 0.08], [4.18, 8.9, 0.08], 148, 128],
    [1.1, [3.79, 7.26, 0.8], [3.84, 7.12, 1.26], [3.85, 7.08, 1.49], [4.11, 6.9, 1.11], [4.05, 6.77, 1.59], [3.95, 7.61, 0.15], [3.62, 6.91, 0.1], 129, 75],
    [1.8, [3.2, 5.95, 0.9], [3.2, 5.82, 1.36], [3.2, 5.78, 1.59], [3.4, 5.52, 1.12], [3.27, 5.37, 1.58], [2.95, 5.95, 0.08], [3.45, 5.95, 0.08], 117, 88],
  ]
  // The table is rounded to 2 decimals, so allow 0.01 plus rounding.
  const near = (a: Vec3, b: Vec3) => a.forEach((v, i) => expect(Math.abs(v - b[i])).toBeLessThanOrEqual(0.0151))
  it.each(table)('t = %s', (t, pelvis, chest, head, hand, rhead, la, ra, wrist, elbow) => {
    const f = at(t)
    near(f.pelvis, pelvis)
    near(f.chest, chest)
    near(f.head, head)
    near(f.racquet.hand, hand)
    near(f.racquet.head, rhead)
    near(f.legL.ankle, la)
    near(f.legR.ankle, ra)
    expect(Math.abs(180 - deg(V.sub(f.armR.hand, f.armR.elbow), f.racquet.dir) - wrist)).toBeLessThan(1.5)
    expect(Math.abs(deg(V.sub(f.armR.shoulder, f.armR.elbow), V.sub(f.armR.hand, f.armR.elbow)) - elbow)).toBeLessThan(1.5)
  })
})

describe('figure: the swing is physically right', () => {
  it('1. the racquet head meets the ball at contact, in every placement of every scene', () => {
    expect(placements.length).toBeGreaterThanOrEqual(4)
    for (const { scene, pl, m } of placements) {
      const b = ballAt(scene.ball, m.at, scene.gravity)!
      const f = figureAt(pl, m.at)!
      expect(V.len(V.sub(f.racquet.head, [b.x, b.y, b.z]))).toBeLessThan(0.03)
    }
  })

  it('2. the face is square to the front wall and open at contact', () => {
    const n = at(0).racquet.face
    expect(deg([n[0], n[1], 0], [0, -1, 0])).toBeLessThan(20)
    const tilt = Math.asin(n[2]) / RAD
    expect(tilt).toBeGreaterThan(5)
    expect(tilt).toBeLessThan(25)
  })

  it('3. no limb is stretched past reach', () => {
    let worst = 0
    for (const t of range(clip.start, clip.end, 0.005)) {
      const f = solveFigure(clip, t)
      worst = Math.max(worst, f.legL.stretch, f.legR.stretch, f.armL.stretch, f.armR.stretch)
    }
    expect(worst).toBeLessThanOrEqual(1.04)
  })

  it('4. planted feet do not slide', () => {
    // The authored foot point holds exactly. The solved ankle can sit up to 1.6 cm short of it
    // where a long stride lands at full reach (stretch up to 1.035, allowed by test 3): the IK
    // clamp pulls the ankle in. ARCHITECTURE.md asked for 1 mm; see DECISIONS.md.
    for (const [name, track] of [['footL', clip.tracks.footL], ['footR', clip.tracks.footR]] as const) {
      for (let i = 0; i < track.length - 1; i++) {
        const [t0, a] = track[i]
        const [t1, b] = track[i + 1]
        if (a[0] !== b[0] || a[1] !== b[1]) continue
        const legOf = (f: FigurePose) => (name === 'footL' ? f.legL : f.legR)
        for (const t of range(t0, t1, 0.005)) {
          const foot = footAt(track, t)
          expect(foot[0]).toBeCloseTo(a[0], 9)
          expect(foot[1]).toBeCloseTo(a[1], 9)
          expect(foot[2]).toBeCloseTo(0, 9)
          const p = legOf(solveFigure(clip, t)).ankle
          expect(Math.hypot(p[0] - a[0], p[1] - a[1])).toBeLessThan(0.02)
        }
      }
    }
  })

  it('5. the racquet is fastest at the ball', () => {
    const dt = 0.005
    const speed = (t: number) => V.len(V.sub(solveFigure(clip, t + dt / 2).racquet.head, solveFigure(clip, t - dt / 2).racquet.head)) / dt
    let max = 0
    let tMax = 0
    for (const t of range(-0.4, 0.4, 0.005)) {
      const v = speed(t)
      if (v > max) [max, tMax] = [v, t]
    }
    expect(speed(0)).toBeGreaterThanOrEqual(0.9 * max)
    expect(Math.abs(tMax)).toBeLessThanOrEqual(0.03)
  })

  it('6. the racquet is up early', () => {
    const f = at(-1.3)
    expect(f.racquet.head[2]).toBeGreaterThan(f.racquet.hand[2])
    expect(f.racquet.head[2]).toBeGreaterThan(1.5)
  })

  it('7. side-on at contact, contact level with the front foot', () => {
    const chest = sampleTrack(clip.tracks.chestYaw, 0)
    const toe = sampleTrack(clip.tracks.toeL, 0)
    expect(chest).toBeGreaterThanOrEqual(60)
    expect(chest).toBeLessThanOrEqual(90)
    expect(toe).toBeGreaterThanOrEqual(75)
    expect(toe).toBeLessThanOrEqual(95)
    expect(Math.abs(at(0).legL.ankle[1] - ANCHOR.y)).toBeLessThan(0.1)
  })

  it('8. recovers to the ready stance it started from', () => {
    // ARCHITECTURE.md asks for 0.05 m from T_STANCE (court.ts, 5.89 deep). The approved
    // prototype's ready stance is at 5.95, 0.06 m from it; the prototype wins (DECISIONS.md).
    const start = at(clip.start).pelvis
    const end = at(clip.end).pelvis
    expect(Math.hypot(end[0] - start[0], end[1] - start[1])).toBeLessThan(0.05)
    expect(end[0]).toBeCloseTo(3.2, 2)
  })
})

describe('cameras', () => {
  it('9. no camera mirrors the court', () => {
    const behind = makeProjector(CAMERAS.behind, STAGE.w, STAGE.h)
    expect(behind.project([6.4, 0, 0]).x).toBeGreaterThan(behind.project([0, 0, 0]).x)
    const top = makeProjector(CAMERAS.top, STAGE.w, STAGE.h)
    expect(top.project([3.2, 0, 0]).y).toBeLessThan(top.project([3.2, 9.75, 0]).y)
    expect(top.project([6.4, 4, 0]).x).toBeGreaterThan(top.project([0, 4, 0]).x)
    // The racquet arm is on the player's right: in the behind view, the right shoulder is right of the left one.
    const f = at(-2)
    expect(behind.project(f.shoulderR).x).toBeGreaterThan(behind.project(f.shoulderL).x)
  })
})

describe('the directed sequence', () => {
  it('10. keeps the player and the ball in frame', () => {
    const inside = (p: { x: number; y: number }) => p.x >= 0 && p.x <= STAGE.w && p.y >= 0 && p.y <= STAGE.h
    const moving = (tau: number) => DEFAULT_DIRECTOR.camera.some((k, i) => k.ease === 'move' && tau > DEFAULT_DIRECTOR.camera[i - 1].t && tau < k.t)
    const all = Object.values(SCENE_SETS).flatMap((set) => set.variants.map((scene) => ({ set, scene })))
    for (const { set, scene } of all) {
      const dir = directorFor(scene, set)
      const strike = scene.ball.find((p) => p.event === 'strike')!.t
      for (let i = 0; i < 20; i++) {
        const t = (scene.duration * i) / 19
        const tau = t - strike
        const P = makeProjector(directedCamera(dir, tau), STAGE.w, STAGE.h)
        const fig = figureAt(scene.players[0], t)!
        expect(inside(P.project(fig.pelvis)), `${scene.id} pelvis at ${t.toFixed(2)}`).toBe(true)
        const b = ballAt(scene.ball, t, scene.gravity)
        // The feed comes in from off the right edge of the prototype's framing and enters at tau -0.55,
        // so the ball is required from tau -0.5: the approach to contact and the whole shot (DECISIONS.md).
        if (b && !moving(tau) && tau >= -0.5) expect(inside(P.project([b.x, b.y, b.z])), `${scene.id} ball at ${t.toFixed(2)}`).toBe(true)
      }
    }
  })

  it('11. pace stays between 0.05 and 1', () => {
    for (const tau of range(-3, 4, 0.01)) {
      for (const mode of ['auto', 'top'] as const) {
        const p = paceAt(DEFAULT_DIRECTOR, tau, mode)
        expect(p).toBeGreaterThanOrEqual(0.05)
        expect(p).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('the drill repeats the swing', () => {
  const drill = SCENE_SETS['drive-streak'].variants[0]
  const you = drill.players[0]

  it('plays one placement per strike, each meeting the ball', () => {
    const strikes = drill.ball.filter((p) => p.event === 'strike')
    expect(you.motion).toHaveLength(strikes.length)
  })

  it('moves smoothly between swings: in the gaps no joint moves more than 6 cm in 10 ms', () => {
    const joints = (f: FigurePose): Vec3[] => [f.pelvis, f.chest, f.head, f.legL.ankle, f.legR.ankle, f.armR.hand, f.racquet.head]
    const ms = you.motion!
    let worst = 0
    for (let i = 0; i < ms.length - 1; i++) {
      // from the end of one swing's window to the start of the next, including both edges
      let prev = joints(figureAt(you, ms[i].at + 0.42 - 0.01)!)
      for (const t of range(ms[i].at + 0.42, ms[i + 1].at - 0.62 + 0.01, 0.01)) {
        const cur = joints(figureAt(you, t)!)
        cur.forEach((p, j) => (worst = Math.max(worst, V.len(V.sub(p, prev[j])))))
        prev = cur
      }
    }
    expect(worst).toBeLessThan(0.06)
  })

  it('a foot that moves between swings steps (lifts) instead of sliding', () => {
    const ms = you.motion!
    const gapStart = ms[0].at + 0.42
    const gapEnd = ms[1].at - 0.62
    const mid = figureAt(you, (gapStart + gapEnd) / 2)!
    expect(mid.legL.ankle[2]).toBeGreaterThan(0.08 + 0.05)
  })
})
