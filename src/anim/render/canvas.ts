import { makeProjector, type Projector, type ScreenPoint } from '../camera'
import { COURT } from '../court'
import { BODY, LIMB_RADII as R } from '../figure/body'
import type { Camera, FigurePose, RacquetPose, Scene, Vec3 } from '../types'
import { V } from '../vec'

/*
 * Canvas 2D stage renderer, ported from the prototype's renderer block.
 * Plan step 1 scope: floor, floor lines, the figure with its shadows, the
 * skeleton overlay and a dot at the contact point. Walls, zones, the real
 * ball, marks and highlights arrive in step 2.
 */

export const STAGE_TOKENS = [
  'floor', 'floor-edge', 'wall', 'wall-side', 'court-line', 'ball', 'ball-edge', 'good', 'bad', 'target', 'target-edge',
  'figure', 'figure-far', 'figure-edge', 'racquet', 'accent', 'stage', 'shadow', 'ink', 'surface',
] as const
export type StageColors = Record<(typeof STAGE_TOKENS)[number], string>

/** Resolve the stage colours from CSS tokens. Call on mount and on theme change, not per frame. */
export function readStageColors(el: Element = document.documentElement): StageColors {
  const cs = getComputedStyle(el)
  const out = {} as StageColors
  for (const k of STAGE_TOKENS) out[k] = cs.getPropertyValue('--' + k).trim()
  return out
}

export interface FrameState {
  /** Scene being shown. Optional until plan step 2 draws scenes. */
  scene?: Scene
  /** Scene time. */
  t: number
  camera: Camera
  figures: FigurePose[]
  /** Ball position, or null when there is no ball. Step 1 draws it as a plain dot. */
  ball: Vec3 | null
  size: { w: number; h: number }
  colors: StageColors
  /** Draw the bones and joints over the figure. */
  skeleton?: boolean
}

export interface StageRenderer {
  resize(w: number, h: number, dpr: number): void
  draw(frame: FrameState): void
  dispose(): void
}

type Part =
  | { depth: number; tint: 'near' | 'far' | 'hit'; path: () => void }
  | { depth: number; racquet: RacquetPose }

export class CanvasStageRenderer implements StageRenderer {
  private ctx: CanvasRenderingContext2D
  private P!: Projector
  private colors!: StageColors

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D is not available')
    this.ctx = ctx
  }

  resize(w: number, h: number, dpr: number) {
    const d = Math.min(dpr || 1, 3)
    this.canvas.width = Math.round(w * d)
    this.canvas.height = Math.round(h * d)
    this.ctx.setTransform(d, 0, 0, d, 0, 0)
  }

  dispose() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  draw(frame: FrameState) {
    const { ctx } = this
    const { w, h } = frame.size
    this.colors = frame.colors
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = this.colors.stage
    ctx.fillRect(0, 0, w, h)
    this.P = makeProjector(frame.camera, w, h)
    this.drawFloor()
    for (const f of frame.figures) this.drawGroundShadow(f)
    // ball in front of or behind the figure, by camera depth
    const fig = frame.figures[0]
    const b = frame.ball
    const ballBehind = !!b && !!fig && this.P.toCam(b)[2] > this.P.toCam(fig.pelvis)[2]
    if (b && ballBehind) this.drawBallDot(b)
    for (const f of frame.figures) this.drawFigure(f, !!frame.skeleton)
    if (b && !ballBehind) this.drawBallDot(b)
  }

  /* ---------- drawing helpers ---------- */
  private pj = (p: Vec3): ScreenPoint => this.P.project(p)

  private poly(pts: Vec3[], fill?: string, stroke?: string, lw?: number) {
    const { ctx } = this
    ctx.beginPath()
    pts.forEach((p, i) => {
      const q = this.pj(p)
      if (i) ctx.lineTo(q.x, q.y)
      else ctx.moveTo(q.x, q.y)
    })
    ctx.closePath()
    if (fill) { ctx.fillStyle = fill; ctx.fill() }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke() }
  }

  /** A court line with real width, drawn as a quad on its surface. n is the in-surface direction of the width. */
  private band(a: Vec3, b: Vec3, n: Vec3, width: number, color: string) {
    const o = V.mul(n, width / 2)
    this.poly([V.sub(a, o), V.sub(b, o), V.add(b, o), V.add(a, o)], color)
  }

  private line3(a: Vec3, b: Vec3, color: string, lw: number, dash?: number[]) {
    const { ctx } = this
    const A = this.pj(a), B = this.pj(b)
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y)
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([])
  }

  /** Tapered capsule between two projected points with pixel radii. */
  private capsule(a: ScreenPoint, ra: number, b: ScreenPoint, rb: number) {
    const { ctx } = this
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy)
    ctx.beginPath()
    if (d < 1e-3 || d <= Math.abs(ra - rb)) {
      const big = ra > rb ? a : b
      ctx.arc(big.x, big.y, Math.max(ra, rb), 0, 7)
      return
    }
    const ang = Math.atan2(dy, dx), off = Math.acos((ra - rb) / d)
    ctx.arc(a.x, a.y, ra, ang + off, ang - off + Math.PI * 2)
    ctx.arc(b.x, b.y, rb, ang - off, ang + off)
    ctx.closePath()
  }

  /* ---------- court: floor and floor lines only in step 1 ---------- */
  private drawFloor() {
    const { ctx, colors } = this
    const C = COURT, W = C.width, L = C.length, red = colors['court-line'], lw = 0.05
    const X: Vec3 = [1, 0, 0], Y: Vec3 = [0, 1, 0]
    this.poly([[0, 0, 0], [W, 0, 0], [W, L, 0], [0, L, 0]], colors.floor)
    // boards hint: a few faint lines along the court
    ctx.globalAlpha = 0.5
    for (let i = 1; i < 8; i++) this.line3([(W * i) / 8, 0, 0], [(W * i) / 8, L, 0], colors['floor-edge'], 0.6)
    ctx.globalAlpha = 1
    const s = C.shortLine, b = C.boxSize
    this.band([0, s, 0], [W, s, 0], Y, lw, red)
    this.band([W / 2, s, 0], [W / 2, L, 0], X, lw, red)
    this.band([b, s, 0], [b, s + b, 0], X, lw, red); this.band([0, s + b, 0], [b, s + b, 0], Y, lw, red)
    this.band([W - b, s, 0], [W - b, s + b, 0], X, lw, red); this.band([W - b, s + b, 0], [W, s + b, 0], Y, lw, red)
    ctx.globalAlpha = 0.9
    this.line3([0, 0, 0], [W, 0, 0], colors['floor-edge'], 1.2); this.line3([W, 0, 0], [W, L, 0], colors['floor-edge'], 1.2)
    this.line3([W, L, 0], [0, L, 0], colors['floor-edge'], 1.2); this.line3([0, L, 0], [0, 0, 0], colors['floor-edge'], 1.2)
    ctx.globalAlpha = 1
  }

  /* ---------- figure ---------- */
  private figureParts(f: FigurePose): Part[] {
    const { ctx } = this
    const parts: Part[] = []
    const cam = (p: Vec3) => this.P.toCam(p)[2]
    const torsoDepth = (cam(f.chest) + cam(f.pelvis)) / 2
    const limb = (a: Vec3, b: Vec3, r: readonly [number, number], tint: 'near' | 'far' | 'hit') => {
      const A = this.pj(a), B = this.pj(b)
      parts.push({ depth: (A.depth + B.depth) / 2, tint, path: () => this.capsule(A, r[0] * A.scale, B, r[1] * B.scale) })
    }
    const dot = (p: Vec3, r: number, tint: 'near' | 'far' | 'hit', bias: number) => {
      const q = this.pj(p)
      parts.push({ depth: q.depth + bias, tint, path: () => { ctx.beginPath(); ctx.arc(q.x, q.y, r * q.scale, 0, 7) } })
    }
    const farTint = (p: Vec3) => (cam(p) > torsoDepth + 0.04 ? 'far' : 'near')
    for (const leg of [f.legL, f.legR]) {
      const tint = farTint(leg.knee)
      limb(leg.hip, leg.knee, R.thigh, tint); limb(leg.knee, leg.ankle, R.shin, tint); limb(leg.heel, leg.toe, R.foot, tint)
    }
    // torso: capsule from chest to pelvis plus a shoulder bar and a hip bar so it has width from every angle
    limb(V.lerp(f.chest, f.pelvis, 0.08), f.pelvis, [R.torsoTop, R.torsoBot], 'near')
    limb(f.shoulderL, f.shoulderR, [R.shoulderBar, R.shoulderBar], 'near')
    limb(f.hipL, f.hipR, [R.hipBar, R.hipBar], 'near')
    limb(f.chest, f.head, R.neck, 'near')
    dot(f.head, BODY.headR, 'near', -0.01)
    {
      const tint = farTint(f.armL.elbow)
      limb(f.armL.shoulder, f.armL.elbow, R.upper, tint); limb(f.armL.elbow, f.armL.hand, R.fore, tint)
      dot(f.armL.hand, R.hand, tint, 0)
    }
    // hitting arm: accent colour
    limb(f.armR.shoulder, f.armR.elbow, R.upper, 'hit'); limb(f.armR.elbow, f.armR.hand, R.fore, 'hit')
    dot(f.armR.hand, R.hand, 'hit', -0.02)
    parts.push({ depth: this.pj(f.racquet.head).depth, racquet: f.racquet })
    return parts.sort((a, b) => b.depth - a.depth)
  }

  private drawRacquet(rq: RacquetPose) {
    const { ctx, colors } = this
    const B = BODY, w = V.norm(V.cross(rq.face, rq.dir))
    const throat = V.add(rq.hand, V.mul(rq.dir, B.racquetReach - B.headLong))
    const g0 = this.pj(rq.butt), g1 = this.pj(V.add(rq.hand, V.mul(rq.dir, 0.09))), th = this.pj(throat)
    const ring: ScreenPoint[] = []
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2
      ring.push(this.pj(V.add(rq.head, V.add(V.mul(rq.dir, Math.cos(a) * B.headLong), V.mul(w, Math.sin(a) * B.headWide)))))
    }
    const ringPath = () => {
      ctx.beginPath()
      ring.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
      ctx.closePath()
    }
    const outline = (lw: number, color: string) => {
      ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(g1.x, g1.y); ctx.lineTo(th.x, th.y); ctx.stroke()
      ringPath(); ctx.stroke()
    }
    const s = th.scale
    outline(Math.max(2.2, 0.03 * s) + 2.5, colors['figure-edge'])
    ringPath()
    ctx.globalAlpha = 0.22; ctx.fillStyle = colors.accent; ctx.fill(); ctx.globalAlpha = 1
    outline(Math.max(2.2, 0.03 * s), colors.racquet)
    // grip
    ctx.strokeStyle = colors.racquet; ctx.lineWidth = Math.max(3, 0.045 * s)
    ctx.beginPath(); ctx.moveTo(g0.x, g0.y); ctx.lineTo(g1.x, g1.y); ctx.stroke()
  }

  private drawFigure(f: FigurePose, skeleton: boolean) {
    const { ctx, colors } = this
    const col = { near: colors.figure, far: colors['figure-far'], hit: colors.accent }
    for (const p of this.figureParts(f)) {
      if ('racquet' in p) { this.drawRacquet(p.racquet); continue }
      p.path(); ctx.lineWidth = 2.5; ctx.strokeStyle = colors['figure-edge']; ctx.lineJoin = 'round'; ctx.stroke()
      p.path(); ctx.fillStyle = col[p.tint]; ctx.fill()
    }
    if (skeleton) {
      const bones: [Vec3, Vec3][] = [[f.pelvis, f.chest], [f.chest, f.head], [f.shoulderL, f.shoulderR], [f.hipL, f.hipR],
        [f.legL.hip, f.legL.knee], [f.legL.knee, f.legL.ankle], [f.legR.hip, f.legR.knee], [f.legR.knee, f.legR.ankle],
        [f.armL.shoulder, f.armL.elbow], [f.armL.elbow, f.armL.hand], [f.armR.shoulder, f.armR.elbow], [f.armR.elbow, f.armR.hand],
        [f.racquet.hand, f.racquet.head]]
      for (const [a, b] of bones) this.line3(a, b, '#19c2ff', 1.5)
      for (const [a, b] of bones) {
        for (const p of [a, b]) {
          const q = this.pj(p)
          ctx.beginPath(); ctx.arc(q.x, q.y, 2.2, 0, 7); ctx.fillStyle = '#fff'; ctx.fill()
          ctx.strokeStyle = '#0a84b5'; ctx.lineWidth = 1; ctx.stroke()
        }
      }
    }
  }

  /** Soft contact shadows: one blob under the pelvis, one under each foot that fades as the foot lifts. */
  private drawGroundShadow(f: FigurePose) {
    const { ctx, colors } = this
    const blob = (p: Vec3, rx: number, ry: number) => {
      const pts: Vec3[] = []
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2
        pts.push([p[0] + Math.cos(a) * rx, p[1] + Math.sin(a) * ry, 0.003])
      }
      this.poly(pts, colors.shadow)
    }
    blob(f.pelvis, 0.34, 0.26)
    for (const leg of [f.legL, f.legR]) {
      const m = V.lerp(leg.heel, leg.toe, 0.5)
      ctx.globalAlpha = Math.max(0, 1 - m[2] * 5)
      blob(m, 0.16, 0.12)
      ctx.globalAlpha = 1
    }
  }

  /** Step 1 stand-in for the ball: a dot, drawn larger than life as in the prototype. */
  private drawBallDot(b: Vec3) {
    const { ctx, colors } = this
    const q = this.pj(b), r = Math.max(3.4, 0.05 * q.scale)
    ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 7); ctx.fillStyle = colors.ball; ctx.fill()
    ctx.lineWidth = 1.2; ctx.strokeStyle = colors['ball-edge']; ctx.stroke()
  }
}
