import { sampleArc, sampleTrack } from '../tracks'
import type { Arm, FigureClip, FigurePose, Leg, Track, Vec2, Vec3 } from '../types'
import { RAD, V } from '../vec'
import { BODY } from './body'

/*
 * Figure solver, ported from the prototype core. Clip frame in, court space
 * out (placeFigure). Pure: no DOM, no state.
 */

/** Two-bone IK. Returns the middle joint; if the target is out of reach the end is pulled in. */
export function ik2(root: Vec3, target: Vec3, a: number, b: number, pole: Vec3): { mid: Vec3; end: Vec3; stretch: number } {
  const d = V.sub(target, root)
  const L = V.len(d)
  const max = (a + b) * 0.999
  const min = Math.abs(a - b) + 1e-4
  const dir = V.norm(d)
  const Lc = Math.min(max, Math.max(min, L))
  const end = Lc === L ? target : V.add(root, V.mul(dir, Lc))
  const x = (a * a - b * b + Lc * Lc) / (2 * Lc)
  const h = Math.sqrt(Math.max(0, a * a - x * x))
  let perp = V.sub(pole, V.mul(dir, V.dot(pole, dir)))
  perp = V.len(perp) < 1e-6 ? [0, 0, 1] : V.norm(perp)
  return { mid: V.add(V.add(root, V.mul(dir, x)), V.mul(perp, h)), end, stretch: L / (a + b) }
}

/** Foot position with automatic lift while it travels between two planted keys. */
export function footAt(track: Track<Vec2>, t: number): Vec3 {
  const p = sampleTrack(track, t)
  let lift = 0
  for (let i = 0; i < track.length - 1; i++) {
    const [t0, a] = track[i]
    const [t1, b] = track[i + 1]
    if (t > t0 && t < t1) {
      const dist = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (dist > 1e-6) lift = BODY.stepLift * Math.min(1, dist / 0.8) * Math.sin((Math.PI * (t - t0)) / (t1 - t0))
    }
  }
  return [p[0], p[1], lift]
}

const fwd = (a: number): Vec3 => [Math.sin(a), -Math.cos(a), 0]
const right = (a: number): Vec3 => [Math.cos(a), Math.sin(a), 0]
const UP: Vec3 = [0, 0, 1]
/** Fixed elbow pole for the off arm, chest frame. */
const OFF_ELBOW: Vec3 = [-0.5, -0.3, -0.8]

/** Solve the whole skeleton at clip time tau. Joints are in the clip frame (u, v, z). */
export function solveFigure(clip: FigureClip, tau: number): FigurePose {
  const T = clip.tracks
  const B = BODY
  const t = Math.min(clip.end, Math.max(clip.start, tau))
  const fl0 = sampleTrack(T.footL, t)
  const fr0 = sampleTrack(T.footR, t)
  const off = sampleTrack(T.pelvisOffset, t)
  // The pelvis rides midway between the feet (plus a keyed offset), so the legs can always reach.
  const pelvis: Vec3 = [(fl0[0] + fr0[0]) / 2 + off[0], (fl0[1] + fr0[1]) / 2 + off[1], sampleTrack(T.pelvisHeight, t)]
  const hy = sampleTrack(T.hipYaw, t) * RAD
  const cy = sampleTrack(T.chestYaw, t) * RAD
  const lean = sampleTrack(T.lean, t) * RAD
  const hipRight = right(hy)
  const cF = fwd(cy)
  const cR = right(cy)
  const chest = V.add(pelvis, V.add(V.mul(cF, Math.sin(lean) * B.spine), V.mul(UP, Math.cos(lean) * B.spine)))
  const head = V.add(chest, V.add(V.mul(cF, Math.sin(lean * 0.6) * B.neck), V.mul(UP, Math.cos(lean * 0.6) * B.neck)))
  const fromChest = (r: Vec3) => V.add(chest, V.add(V.add(V.mul(cR, r[0]), V.mul(cF, r[1])), V.mul(UP, r[2])))
  const dirFromChest = (r: Vec3) => V.norm(V.add(V.add(V.mul(cR, r[0]), V.mul(cF, r[1])), V.mul(UP, r[2])))
  const shoulderR = V.add(chest, V.mul(cR, B.shoulderHalf))
  const shoulderL = V.add(chest, V.mul(cR, -B.shoulderHalf))
  const hipR = V.add(pelvis, V.mul(hipRight, B.hipHalf))
  const hipL = V.add(pelvis, V.mul(hipRight, -B.hipHalf))

  const leg = (hip: Vec3, footTrack: Track<Vec2>, toeTrack: Track<number>): Leg => {
    const f = footAt(footTrack, t)
    const tf = fwd(sampleTrack(toeTrack, t) * RAD)
    const ankleT: Vec3 = [f[0], f[1], f[2] + B.ankle]
    const pole = V.norm(V.add(V.add(V.mul(fwd(hy), 0.6), V.mul(tf, 0.6)), [0, 0, 0.25]))
    const s = ik2(hip, ankleT, B.thigh, B.shin, pole)
    const drop = f[2] > 0.02 ? -0.04 : 0 // toes hang a little while the foot is in the air
    return {
      hip,
      knee: s.mid,
      ankle: s.end,
      heel: V.add(V.sub(s.end, V.mul(tf, B.footHeel)), [0, 0, -B.ankle + 0.03]),
      toe: V.add(V.add(s.end, V.mul(tf, B.footToe)), [0, 0, -B.ankle + 0.03 + drop]),
      stretch: s.stretch,
    }
  }
  const legL = leg(hipL, T.footL, T.toeL)
  const legR = leg(hipR, T.footR, T.toeR)

  const aR = ik2(shoulderR, fromChest(sampleTrack(T.handR, t)), B.upperArm, B.forearm, dirFromChest(sampleArc(T.elbowR, t)))
  const aL = ik2(shoulderL, fromChest(sampleTrack(T.handL, t)), B.upperArm, B.forearm, dirFromChest(OFF_ELBOW))
  const rDir = dirFromChest(sampleArc(T.racquetDir, t))
  let face = dirFromChest(sampleArc(T.racquetFace, t))
  face = V.norm(V.sub(face, V.mul(rDir, V.dot(face, rDir)))) // keep the face normal square to the shaft
  const hand = aR.end
  const armR: Arm = { shoulder: shoulderR, elbow: aR.mid, hand, stretch: aR.stretch }
  const armL: Arm = { shoulder: shoulderL, elbow: aL.mid, hand: aL.end, stretch: aL.stretch }
  return {
    pelvis, chest, head, shoulderL, shoulderR, hipL, hipR, legL, legR, armR, armL,
    racquet: { hand, dir: rDir, face, head: V.add(hand, V.mul(rDir, B.racquetReach)), butt: V.sub(hand, V.mul(rDir, 0.07)) },
  }
}

/** Map the solved figure from the clip frame into court space. mirror = true flips it for a left-hander. */
export function placeFigure(fig: FigurePose, anchor: { x: number; y: number }, mirror = false): FigurePose {
  const s = mirror ? -1 : 1
  const f = (p: Vec3): Vec3 => [anchor.x + s * p[0], anchor.y + p[1], p[2]]
  const d = (p: Vec3): Vec3 => [s * p[0], p[1], p[2]]
  const leg = (l: Leg): Leg => ({ hip: f(l.hip), knee: f(l.knee), ankle: f(l.ankle), heel: f(l.heel), toe: f(l.toe), stretch: l.stretch })
  const arm = (a: Arm): Arm => ({ shoulder: f(a.shoulder), elbow: f(a.elbow), hand: f(a.hand), stretch: a.stretch })
  const r = fig.racquet
  return {
    pelvis: f(fig.pelvis), chest: f(fig.chest), head: f(fig.head),
    shoulderL: f(fig.shoulderL), shoulderR: f(fig.shoulderR), hipL: f(fig.hipL), hipR: f(fig.hipR),
    legL: leg(fig.legL), legR: leg(fig.legR), armL: arm(fig.armL), armR: arm(fig.armR),
    racquet: { hand: f(r.hand), head: f(r.head), butt: f(r.butt), dir: d(r.dir), face: d(r.face) },
  }
}
