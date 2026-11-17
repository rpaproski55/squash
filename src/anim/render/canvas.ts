import { isTopDown, makeProjector, type Projected, type Projector } from '../camera'
import { COURT } from '../court'
import { BODY, LIMB_R } from '../figure/body'
import type { FigurePose, Racquet, Vec3 } from '../types'
import { V } from '../vec'
import type { StageColors } from './colors'
import type { FrameState, StageRenderer } from './types'

/*
 * Canvas 2D stage renderer. Ported from the renderer block of
 * docs/animation/prototypes/straight-drive.html. Reads only FrameState.
 */

type Part =
  | { depth: number; tint: 'near' | 'far' | 'hit'; path: () => void }
  | { depth: number; racquet: Racquet }

export class CanvasStageRenderer implements StageRenderer {
  private ctx: CanvasRenderingContext2D
  private P!: Projector
  private c!: StageColors
  private w = 0
  private h = 0

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2D canvas')
    this.ctx = ctx
  }

  resize(w: number, h: number, dpr: number) {
    const r = Math.min(dpr || 1, 3)
    this.w = w
    this.h = h
    this.canvas.width = Math.round(w * r)
    this.canvas.height = Math.round(h * r)
    this.ctx.setTransform(r, 0, 0, r, 0, 0)
  }

  dispose() {}

  draw(f: FrameState) {
    const { ctx } = this
    const W = this.w || f.size.w
    const H = this.h || f.size.h
    this.c = f.colors
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = this.c.stage
    ctx.fillRect(0, 0, W, H)
    this.P = makeProjector(f.camera, W, H)
    this.drawCourt(f.camera.pos)
    for (const fig of f.figures) this.drawGroundShadow(fig)
    const ball = f.ball ?? null
    const pelvisDepth = f.figures[0] ? this.P.toCam(f.figures[0].pelvis)[2] : Infinity
    const ballBehind = ball && this.P.toCam(ball)[2] > pelvisDepth
    if (ball && ballBehind) this.drawBall(ball)
    for (const fig of f.figures) this.drawFigure(fig, !!f.skeleton)
    if (ball && !ballBehind) this.drawBall(ball)
    if (f.fade && f.fade > 0) {
      ctx.globalAlpha = f.fade
      ctx.fillStyle = this.c.stage
      ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 1
    }
  }

  /* ---------- helpers ---------- */
  private pj = (p: Vec3): Projected => this.P.project(p)

  private poly(pts: Vec3[], fill?: string, stroke?: string, lw?: number) {
    const { ctx } = this
    ctx.beginPath()
    pts.forEach((p, i) => {
      const q = this.pj(p)
      if (i) ctx.lineTo(q.x, q.y)
      else ctx.moveTo(q.x, q.y)
    })
    ctx.closePath()
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = lw || 1
      ctx.stroke()
    }
  }

  /** A court line with real width, drawn as a quad on its surface. n is the in-surface direction of the width. */
  private band(a: Vec3, b: Vec3, n: Vec3, width: number, color: string) {
    const o = V.mul(n, width / 2)
    this.poly([V.sub(a, o), V.sub(b, o), V.add(b, o), V.add(a, o)], color)
  }

  private line3(a: Vec3, b: Vec3, color: string, lw: number, dash?: number[]) {
    const { ctx } = this
    const A = this.pj(a)
    const B = this.pj(b)
    ctx.beginPath()
    ctx.moveTo(A.x, A.y)
    ctx.lineTo(B.x, B.y)
    ctx.strokeStyle = color
    ctx.lineWidth = lw
    ctx.setLineDash(dash || [])
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.setLineDash([])
  }

  /** Tapered capsule between two projected points with pixel radii. */
  private capsule(a: Projected, ra: number, b: Projected, rb: number) {
    const { ctx } = this
    const dx = b.x - a.x
    const dy = b.y - a.y
    const d = Math.hypot(dx, dy)
    ctx.beginPath()
    if (d < 1e-3 || d <= Math.abs(ra - rb)) {
      const big = ra > rb ? a : b
      ctx.arc(big.x, big.y, Math.max(ra, rb), 0, 7)
      return
    }
    const ang = Math.atan2(dy, dx)
    const off = Math.acos((ra - rb) / d)
    ctx.arc(a.x, a.y, ra, ang + off, ang - off + Math.PI * 2)
    ctx.arc(b.x, b.y, rb, ang - off, ang + off)
    ctx.closePath()
  }

  /* ---------- court ---------- */
  private drawCourt(camPos: Vec3) {
    const { ctx, c } = this
    const C = COURT
    const W = C.width
    const L = C.length
    const red = c['court-line']
    const lw = 0.05
    const X: Vec3 = [1, 0, 0]
    const Y: Vec3 = [0, 1, 0]
    const Z: Vec3 = [0, 0, 1]
    const fromTop = isTopDown(this.P.cam)
    this.poly([[0, 0, 0], [W, 0, 0], [W, L, 0], [0, L, 0]], c.floor)
    // boards hint: a few faint lines along the court
    ctx.globalAlpha = 0.5
    for (let i = 1; i < 8; i++) this.line3([(W * i) / 8, 0, 0], [(W * i) / 8, L, 0], c['floor-edge'], 0.6)
    ctx.globalAlpha = 1
    if (!fromTop) {
      // front wall
      if (camPos[1] > 0) {
        this.poly([[0, 0, 0], [W, 0, 0], [W, 0, C.frontOut + 0.5], [0, 0, C.frontOut + 0.5]], c.wall)
        this.poly([[0, 0, 0], [W, 0, 0], [W, 0, C.tin], [0, 0, C.tin]], red) // tin
        this.band([0, 0, C.serviceLine], [W, 0, C.serviceLine], Z, lw, red)
        this.band([0, 0, C.frontOut], [W, 0, C.frontOut], Z, lw, red)
      }
      // side walls: fill only the one the camera can see the inside of
      const side = (x: number) => {
        this.poly([[x, 0, 0], [x, L, 0], [x, L, C.backOut + 0.4], [x, 0, C.frontOut + 0.5]], c['wall-side'])
        const n = V.norm([0, -(C.backOut - C.frontOut), L]) // across the sloping out line
        this.band([x, 0, C.frontOut], [x, L, C.backOut], n, lw, red)
      }
      if (camPos[0] > 0) side(0)
      if (camPos[0] < W) side(W)
      else {
        // looking in through the right wall: only its out line, faint
        ctx.globalAlpha = 0.35
        this.line3([W, 0, C.frontOut], [W, L, C.backOut], red, 1.2)
        ctx.globalAlpha = 1
      }
      if (camPos[1] < L) this.poly([[0, L, 0], [W, L, 0], [W, L, C.backOut], [0, L, C.backOut]], c['wall-side'])
      // corner edges
      ctx.globalAlpha = 0.6
      this.line3([0, 0, 0], [0, 0, C.frontOut + 0.5], c['floor-edge'], 1)
      this.line3([W, 0, 0], [W, 0, C.frontOut + 0.5], c['floor-edge'], 1)
      ctx.globalAlpha = 1
    }
    // floor lines
    const s = C.shortLine
    const b = C.boxSize
    this.band([0, s, 0], [W, s, 0], Y, lw, red)
    this.band([W / 2, s, 0], [W / 2, L, 0], X, lw, red)
    this.band([b, s, 0], [b, s + b, 0], X, lw, red)
    this.band([0, s + b, 0], [b, s + b, 0], Y, lw, red)
    this.band([W - b, s, 0], [W - b, s + b, 0], X, lw, red)
    this.band([W - b, s + b, 0], [W, s + b, 0], Y, lw, red)
    // floor outline
    ctx.globalAlpha = 0.9
    this.line3([0, 0, 0], [W, 0, 0], c['floor-edge'], 1.2)
    this.line3([W, 0, 0], [W, L, 0], c['floor-edge'], 1.2)
    this.line3([W, L, 0], [0, L, 0], c['floor-edge'], 1.2)
    this.line3([0, L, 0], [0, 0, 0], c['floor-edge'], 1.2)
    ctx.globalAlpha = 1
  }

  /* ---------- figure ---------- */
  private figureParts(f: FigurePose): Part[] {
    const { ctx } = this
    const parts: Part[] = []
    const cam = (p: Vec3) => this.P.toCam(p)[2]
    const torsoDepth = (cam(f.chest) + cam(f.pelvis)) / 2
    const limb = (a: Vec3, b: Vec3, r: readonly [number, number], tint: 'near' | 'far' | 'hit') => {
      const A = this.pj(a)
      const B = this.pj(b)
      parts.push({ depth: (A.depth + B.depth) / 2, tint, path: () => this.capsule(A, r[0] * A.scale, B, r[1] * B.scale) })
    }
    const dot = (p: Vec3, r: number, tint: 'near' | 'far' | 'hit', bias: number) => {
      const q = this.pj(p)
      parts.push({ depth: q.depth + bias, tint, path: () => { ctx.beginPath(); ctx.arc(q.x, q.y, r * q.scale, 0, 7) } })
    }
    const farTint = (p: Vec3) => (cam(p) > torsoDepth + 0.04 ? 'far' : 'near')
    for (const leg of [f.legL, f.legR]) {
      const tint = farTint(leg.knee)
      limb(leg.hip, leg.knee, LIMB_R.thigh, tint)
      limb(leg.knee, leg.ankle, LIMB_R.shin, tint)
      limb(leg.heel, leg.toe, LIMB_R.foot, tint)
    }
    // torso: capsule from chest to pelvis plus a shoulder bar and a hip bar so it has width from every angle
    limb(V.lerp(f.chest, f.pelvis, 0.08), f.pelvis, [LIMB_R.torsoTop, LIMB_R.torsoBot], 'near')
    limb(f.shoulderL, f.shoulderR, [LIMB_R.shoulderBar, LIMB_R.shoulderBar], 'near')
    limb(f.hipL, f.hipR, [LIMB_R.hipBar, LIMB_R.hipBar], 'near')
    limb(f.chest, f.head, LIMB_R.neck, 'near')
    dot(f.head, BODY.headR, 'near', -0.01)
    {
      const tint = farTint(f.armL.elbow)
      limb(f.armL.shoulder, f.armL.elbow, LIMB_R.upper, tint)
      limb(f.armL.elbow, f.armL.hand, LIMB_R.fore, tint)
      dot(f.armL.hand, LIMB_R.hand, tint, 0)
    }
    // hitting arm: accent colour
    limb(f.armR.shoulder, f.armR.elbow, LIMB_R.upper, 'hit')
    limb(f.armR.elbow, f.armR.hand, LIMB_R.fore, 'hit')
    dot(f.armR.hand, LIMB_R.hand, 'hit', -0.02)
    parts.push({ depth: this.pj(f.racquet.head).depth, racquet: f.racquet })
    return parts.sort((a, b) => b.depth - a.depth)
  }

  private drawRacquet(rq: Racquet) {
    const { ctx, c } = this
    const B = BODY
    const w = V.norm(V.cross(rq.face, rq.dir))
    const throat = V.add(rq.hand, V.mul(rq.dir, B.racquetReach - B.headLong))
    const g0 = this.pj(rq.butt)
    const g1 = this.pj(V.add(rq.hand, V.mul(rq.dir, 0.09)))
    const th = this.pj(throat)
    const ring: Projected[] = []
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
      ctx.strokeStyle = color
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = lw
      ctx.beginPath()
      ctx.moveTo(g1.x, g1.y)
      ctx.lineTo(th.x, th.y)
      ctx.stroke()
      ringPath()
      ctx.stroke()
    }
    const s = th.scale
    outline(Math.max(2.2, 0.03 * s) + 2.5, c['figure-edge'])
    ringPath()
    ctx.globalAlpha = 0.22
    ctx.fillStyle = c.accent
    ctx.fill()
    ctx.globalAlpha = 1
    outline(Math.max(2.2, 0.03 * s), c.racquet)
    // grip
    ctx.strokeStyle = c.racquet
    ctx.lineWidth = Math.max(3, 0.045 * s)
    ctx.beginPath()
    ctx.moveTo(g0.x, g0.y)
    ctx.lineTo(g1.x, g1.y)
    ctx.stroke()
  }

  private drawFigure(f: FigurePose, skeleton: boolean) {
    const { ctx, c } = this
    const col = { near: c.figure, far: c['figure-far'], hit: c.accent }
    for (const p of this.figureParts(f)) {
      if ('racquet' in p) {
        this.drawRacquet(p.racquet)
        continue
      }
      p.path()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = c['figure-edge']
      ctx.lineJoin = 'round'
      ctx.stroke()
      p.path()
      ctx.fillStyle = col[p.tint]
      ctx.fill()
    }
    if (skeleton) {
      const bones: [Vec3, Vec3][] = [
        [f.pelvis, f.chest], [f.chest, f.head], [f.shoulderL, f.shoulderR], [f.hipL, f.hipR],
        [f.legL.hip, f.legL.knee], [f.legL.knee, f.legL.ankle], [f.legR.hip, f.legR.knee], [f.legR.knee, f.legR.ankle],
        [f.armL.shoulder, f.armL.elbow], [f.armL.elbow, f.armL.hand], [f.armR.shoulder, f.armR.elbow], [f.armR.elbow, f.armR.hand],
        [f.racquet.hand, f.racquet.head],
      ]
      for (const [a, b] of bones) this.line3(a, b, '#19c2ff', 1.5)
      for (const [a, b] of bones)
        for (const p of [a, b]) {
          const q = this.pj(p)
          ctx.beginPath()
          ctx.arc(q.x, q.y, 2.2, 0, 7)
          ctx.fillStyle = '#fff'
          ctx.fill()
          ctx.strokeStyle = '#0a84b5'
          ctx.lineWidth = 1
          ctx.stroke()
        }
    }
  }

  /** Soft contact shadows: one blob under the pelvis, one under each foot that fades as the foot lifts. */
  private drawGroundShadow(f: FigurePose) {
    const { ctx, c } = this
    const blob = (p: Vec3, rx: number, ry: number) => {
      const pts: Vec3[] = []
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2
        pts.push([p[0] + Math.cos(a) * rx, p[1] + Math.sin(a) * ry, 0.003])
      }
      this.poly(pts, c.shadow)
    }
    blob(f.pelvis, 0.34, 0.26)
    for (const leg of [f.legL, f.legR]) {
      const m = V.lerp(leg.heel, leg.toe, 0.5)
      ctx.globalAlpha = Math.max(0, 1 - m[2] * 5)
      blob(m, 0.16, 0.12)
      ctx.globalAlpha = 1
    }
  }

  /* ---------- ball (step 1: just the ball, no trail or shadow yet) ---------- */
  private drawBall(b: Vec3) {
    const { ctx, c } = this
    const q = this.pj(b)
    const r = Math.max(3.4, 0.05 * q.scale) // drawn larger than life (real radius 0.02 m)
    ctx.beginPath()
    ctx.arc(q.x, q.y, r, 0, 7)
    ctx.fillStyle = c.ball
    ctx.fill()
    ctx.lineWidth = 1.2
    ctx.strokeStyle = c['ball-edge']
    ctx.stroke()
  }
}
