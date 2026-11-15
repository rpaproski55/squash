import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { COURT, RACQUET, T_POINT, sideOutAt } from '../anim/court'
import { getSceneSet } from '../anim/scenes'
import { ballAt, captionAt, counterAt, playerAt, samplePath, swingAt, type Vec3 } from '../anim/trajectory'
import type { BallPoint, Scene } from '../anim/types'
import { Icon } from './Icon'

/* ---------------------------------------------------------------------------
 * Playback
 * ------------------------------------------------------------------------- */

const HOLD = 1.1 // seconds to rest on the last frame before looping

function usePlayback(scene: Scene, rootRef: React.RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion() ?? false
  const [t, setT] = useState(reduced ? scene.duration : 0)
  const [playing, setPlaying] = useState(!reduced)
  const [speed, setSpeed] = useState(1)
  const [visible, setVisible] = useState(true)
  const tRef = useRef(t)

  // Restart when the scene changes.
  useEffect(() => {
    const start = reduced ? scene.duration : 0
    tRef.current = start
    setT(start)
    setPlaying(!reduced)
  }, [scene, reduced])

  // Pause while scrolled out of view.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [rootRef])

  useEffect(() => {
    if (!playing || !visible) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      let next = tRef.current + dt * speed
      if (next > scene.duration + HOLD) {
        if (reduced) {
          // Under reduced motion, play once and stop on the final frame.
          next = scene.duration
          setPlaying(false)
        } else next = 0
      }
      tRef.current = next
      setT(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, visible, speed, scene, reduced])

  const seek = (v: number) => {
    tRef.current = v
    setT(v)
  }
  const toggle = () => {
    if (!playing && tRef.current >= scene.duration) seek(0)
    setPlaying((p) => !p)
  }

  return { t: Math.min(t, scene.duration), playing, toggle, seek, setPlaying, speed, setSpeed, reduced }
}

/* ---------------------------------------------------------------------------
 * Frame: everything a renderer needs at time t, computed once.
 * ------------------------------------------------------------------------- */

interface Frame {
  t: number
  ball: Vec3 | null
  feedPath: Vec3[]
  shotPath: Vec3[]
  trail: Vec3[]
  marks: (BallPoint & { i: number })[]
  bounces: BallPoint[]
  frontHits: BallPoint[]
  players: { id: string; role: string; label: string; x: number; y: number; swing: ReturnType<typeof swingAt> }[]
  zonePulse: boolean
}

function useFrame(scene: Scene, t: number): Frame {
  const paths = useMemo(() => {
    const strike = scene.ball.find((p) => p.event === 'strike')?.t ?? scene.ball[0].t
    return {
      feedPath: samplePath(scene.ball, scene.gravity, scene.ball[0].t, strike),
      shotPath: samplePath(scene.ball, scene.gravity, strike, scene.ball[scene.ball.length - 1].t),
    }
  }, [scene])

  const trail: Vec3[] = []
  for (let k = 10; k >= 1; k--) {
    const p = ballAt(scene.ball, t - k * 0.03, scene.gravity)
    if (p) trail.push(p)
  }

  const passed = scene.ball.map((p, i) => ({ ...p, i })).filter((p) => p.t <= t)
  return {
    t,
    ball: ballAt(scene.ball, t, scene.gravity),
    ...paths,
    trail,
    marks: passed.filter((p) => p.mark),
    bounces: passed.filter((p) => p.event === 'bounce' && !p.mark),
    frontHits: passed.filter((p) => p.event === 'front' && !p.mark),
    players: scene.players.map((pl) => ({ id: pl.id, role: pl.role, label: pl.label, ...playerAt(pl.keys, t), swing: swingAt(pl.keys, t) })),
    zonePulse: passed.some((p) => p.mark === 'good' && p.event === 'bounce' && t - p.t < 0.6),
  }
}

/* ---------------------------------------------------------------------------
 * Shared marks
 * ------------------------------------------------------------------------- */

const pop = { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 500, damping: 22 } }
const fillBox = { transformBox: 'fill-box' as const, transformOrigin: 'center' }

function Marker({ x, y, kind }: { x: number; y: number; kind: 'good' | 'bad' | 'info' }) {
  const color = kind === 'good' ? 'var(--good)' : kind === 'bad' ? 'var(--bad)' : 'var(--ink-2)'
  return (
    <motion.g {...pop} style={fillBox}>
      <circle cx={x} cy={y} r={22} fill="var(--surface)" stroke={color} strokeWidth={5} />
      {kind === 'good' ? (
        <path d={`M${x - 9} ${y + 1} l6 6 l12 -13`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={`M${x - 7} ${y - 7} l14 14 M${x + 7} ${y - 7} l-14 14`} stroke={color} strokeWidth={5} strokeLinecap="round" />
      )}
    </motion.g>
  )
}

function pathD(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
}

/* ---------------------------------------------------------------------------
 * Top view: the court from above, front wall at the top.
 * ------------------------------------------------------------------------- */

const S = 100 // px per metre

function TopView({ scene, f }: { scene: Scene; f: Frame }) {
  const W = COURT.width * S
  const L = COURT.length * S
  const short = COURT.shortLine * S
  const box = COURT.boxSize * S
  const P = (p: { x: number; y: number }): [number, number] => [p.x * S, p.y * S]
  // Lift the ball off its shadow to suggest height.
  const lift = (p: Vec3): [number, number] => [p.x * S - p.z * 7, p.y * S - p.z * 16]

  return (
    <svg viewBox={`-28 -110 ${W + 56} ${L + 138}`} role="img" aria-label={`Court from above: ${scene.label}`}>
      {/* walls */}
      <rect x={-14} y={-14} width={W + 28} height={L + 28} rx={10} fill="var(--wall)" stroke="var(--line)" strokeWidth={2} />
      <rect x={0} y={0} width={W} height={L} fill="var(--floor)" />
      <text x={W * 0.64} y={-30} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--ink-3)" letterSpacing={2}>
        FRONT WALL
      </text>
      {/* floor lines */}
      <g stroke="var(--court-line)" strokeWidth={5} fill="none" opacity={0.85}>
        <line x1={0} y1={short} x2={W} y2={short} />
        <line x1={W / 2} y1={short} x2={W / 2} y2={L} />
        <rect x={0} y={short} width={box} height={box} />
        <rect x={W - box} y={short} width={box} height={box} />
      </g>
      {/* the T */}
      <circle cx={T_POINT.x * S} cy={T_POINT.y * S} r={9} fill="var(--court-line)" />
      <text x={T_POINT.x * S + 16} y={T_POINT.y * S - 12} fontSize={20} fontWeight={800} fill="var(--court-line)">
        T
      </text>

      {/* zones */}
      {scene.zones.map((z) =>
        z.surface === 'floor' ? (
          <g key={z.id}>
            <motion.rect
              x={z.x * S} y={z.y * S} width={z.w * S} height={z.h * S} rx={10}
              fill="var(--target)" stroke="var(--target-edge)" strokeWidth={3} strokeDasharray="10 8"
              animate={{ opacity: f.zonePulse ? 1 : 0.75 }}
              transition={{ duration: 0.25 }}
            />
            {z.label && (
              <text
                x={z.x * S + (z.w * S) / 2} y={z.y * S + (z.h * S) / 2} fontSize={19} fontWeight={800}
                fill="var(--good)" textAnchor="middle" transform={`rotate(-90 ${z.x * S + (z.w * S) / 2} ${z.y * S + (z.h * S) / 2})`}
                dy={7}
              >
                {z.label.toUpperCase()}
              </text>
            )}
          </g>
        ) : (
          // Front-wall target seen from above: a band along the front wall.
          <rect key={z.id} x={z.x * S} y={-14} width={z.w * S} height={14} rx={4} fill="var(--good)" opacity={0.7} />
        ),
      )}

      {/* paths */}
      <path d={pathD(f.feedPath.map(P))} fill="none" stroke="var(--ink-3)" strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" opacity={0.6} />
      <path d={pathD(f.shotPath.map(P))} fill="none" stroke="var(--ink-2)" strokeWidth={3.5} strokeDasharray="12 10" strokeLinecap="round" opacity={0.5} />

      {/* passed points */}
      {f.bounces.map((b, i) => (
        <circle key={`b${i}`} cx={b.x * S} cy={b.y * S} r={8} fill="none" stroke="var(--ink-2)" strokeWidth={3} opacity={0.7} />
      ))}
      {f.frontHits.map((b, i) => (
        <circle key={`f${i}`} cx={b.x * S} cy={0} r={8} fill="var(--ink-2)" opacity={0.7} />
      ))}

      {/* players */}
      {f.players.map((p) => <TopPlayer key={p.id} p={p} />)}

      {/* ball */}
      {f.ball && (
        <g>
          <ellipse cx={f.ball.x * S} cy={f.ball.y * S} rx={12} ry={9} fill="#000" opacity={0.16} />
          {f.trail.map((p, i) => {
            const [x, y] = lift(p)
            return <circle key={i} cx={x} cy={y} r={4 + i * 0.7} fill="var(--ball)" opacity={0.08 + i * 0.05} />
          })}
          <circle cx={lift(f.ball)[0]} cy={lift(f.ball)[1]} r={12 + f.ball.z * 2.5} fill="var(--ball)" stroke="var(--ball-edge)" strokeWidth={2.5} />
        </g>
      )}

      {/* marks last, on top */}
      {f.marks.map((m) => {
        const [x, y] = m.event === 'front' ? [m.x * S, -6] : P(m)
        return <Marker key={m.i} x={x} y={y} kind={m.mark!} />
      })}
    </svg>
  )
}

function TopPlayer({ p }: { p: Frame['players'][number] }) {
  const cx = p.x * S
  const cy = p.y * S
  // Facing the right wall for a forehand: racquet sweeps from behind (back
  // wall) through contact beside the body to a follow-through toward the front.
  let angle = 55
  let reach = RACQUET * S * 0.55
  if (p.swing) {
    angle = p.swing.phase < 0 ? -p.swing.phase * 100 : -p.swing.phase * 80
    reach = RACQUET * S * 0.85
  }
  const rad = (angle * Math.PI) / 180
  const hx = cx + Math.cos(rad) * reach
  const hy = cy + Math.sin(rad) * reach
  const color = p.role === 'you' ? 'var(--accent)' : 'var(--ink-3)'
  return (
    <g>
      <circle cx={cx} cy={cy} r={34} fill={color} opacity={0.14} />
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="var(--ink)" strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={hx} cy={hy} rx={11} ry={15} fill="var(--surface)" stroke="var(--ink)" strokeWidth={4} transform={`rotate(${angle} ${hx} ${hy})`} />
      <circle cx={cx} cy={cy} r={22} fill={color} stroke="var(--surface)" strokeWidth={5} />
      <text x={cx} y={cy + 56} textAnchor="middle" fontSize={20} fontWeight={800} fill="var(--ink)">
        {p.label}
      </text>
    </g>
  )
}

/* ---------------------------------------------------------------------------
 * Side view: looking through the right side wall, front wall on the left.
 * ------------------------------------------------------------------------- */

function SideView({ scene, f }: { scene: Scene; f: Frame }) {
  const L = COURT.length * S
  const H = COURT.frontOut * S
  const P = (p: { y: number; z: number }): [number, number] => [p.y * S, H - p.z * S]
  const floor = H

  return (
    <svg viewBox={`-120 -70 ${L + 150} ${H + 120}`} role="img" aria-label={`Court from the side: ${scene.label}`}>
      {/* wall area and floor */}
      <path d={`M0 0 L0 ${floor} L${L} ${floor} L${L} ${H - COURT.backOut * S} Z`} fill="var(--wall)" />
      <rect x={0} y={floor} width={L} height={16} fill="var(--floor)" stroke="var(--floor-edge)" />
      {/* side-wall out line */}
      <line x1={0} y1={H - sideOutAt(0) * S} x2={L} y2={H - sideOutAt(COURT.length) * S} stroke="var(--court-line)" strokeWidth={5} />
      {/* front wall */}
      <rect x={-18} y={0} width={18} height={floor + 16} fill="var(--surface-2)" />
      <rect x={-18} y={floor - COURT.tin * S} width={18} height={COURT.tin * S} fill="var(--court-line)" opacity={0.9} />
      <line x1={-18} y1={floor - COURT.serviceLine * S} x2={12} y2={floor - COURT.serviceLine * S} stroke="var(--court-line)" strokeWidth={5} />
      <text x={-24} y={floor - COURT.serviceLine * S + 7} textAnchor="end" fontSize={19} fontWeight={700} fill="var(--ink-3)">
        Service
      </text>
      <text x={-24} y={floor - COURT.tin * S / 2 + 7} textAnchor="end" fontSize={19} fontWeight={700} fill="var(--ink-3)">
        Tin
      </text>
      {/* back wall */}
      <rect x={L} y={H - COURT.backOut * S} width={14} height={COURT.backOut * S + 16} fill="var(--surface-2)" />

      {/* floor markings: short line and back of the service box */}
      {[COURT.shortLine, COURT.shortLine + COURT.boxSize].map((y) => (
        <rect key={y} x={y * S - 3} y={floor} width={6} height={10} fill="var(--court-line)" />
      ))}
      <text x={COURT.shortLine * S} y={floor + 40} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--ink-3)">
        Short line
      </text>
      <text x={(COURT.shortLine + COURT.boxSize) * S + 6} y={floor + 40} textAnchor="start" fontSize={18} fontWeight={700} fill="var(--ink-3)">
        Back of box
      </text>

      {/* zones */}
      {scene.zones.map((z) =>
        z.surface === 'front' ? (
          <rect key={z.id} x={0} y={H - (z.z + z.h) * S} width={22} height={z.h * S} rx={6} fill="var(--target)" stroke="var(--target-edge)" strokeWidth={3} />
        ) : (
          <motion.rect
            key={z.id} x={z.y * S} y={floor - 12} width={z.h * S} height={12} rx={4}
            fill="var(--good)" animate={{ opacity: f.zonePulse ? 0.9 : 0.45 }} transition={{ duration: 0.25 }}
          />
        ),
      )}

      {/* players */}
      {f.players.map((p) => {
        const x = p.y * S
        const color = p.role === 'you' ? 'var(--accent)' : 'var(--ink-3)'
        return (
          <g key={p.id} opacity={0.9}>
            <rect x={x - 17} y={floor - 150} width={34} height={150} rx={17} fill={color} opacity={0.3} />
            <circle cx={x} cy={floor - 172} r={18} fill={color} opacity={0.45} />
          </g>
        )
      })}

      {/* paths */}
      <path d={pathD(f.feedPath.map(P))} fill="none" stroke="var(--ink-3)" strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" opacity={0.6} />
      <path d={pathD(f.shotPath.map(P))} fill="none" stroke="var(--ink-2)" strokeWidth={3.5} strokeDasharray="12 10" strokeLinecap="round" opacity={0.5} />

      {f.bounces.map((b, i) => (
        <circle key={`b${i}`} cx={b.y * S} cy={floor} r={7} fill="none" stroke="var(--ink-2)" strokeWidth={3} opacity={0.7} />
      ))}
      {f.frontHits.map((b, i) => (
        <circle key={`f${i}`} cx={0} cy={H - b.z * S} r={7} fill="var(--ink-2)" opacity={0.7} />
      ))}

      {f.ball && (
        <g>
          <ellipse cx={f.ball.y * S} cy={floor + 2} rx={12 - Math.min(f.ball.z, 3) * 2} ry={4} fill="#000" opacity={0.18} />
          {f.trail.map((p, i) => {
            const [x, y] = P(p)
            return <circle key={i} cx={x} cy={y} r={4 + i * 0.6} fill="var(--ball)" opacity={0.08 + i * 0.05} />
          })}
          <circle cx={P(f.ball)[0]} cy={P(f.ball)[1]} r={12} fill="var(--ball)" stroke="var(--ball-edge)" strokeWidth={2.5} />
        </g>
      )}

      {f.marks.map((m) => {
        const [x, y] = m.event === 'front' ? [4, H - m.z * S] : P(m)
        return <Marker key={m.i} x={x} y={y} kind={m.mark!} />
      })}
    </svg>
  )
}

/* ---------------------------------------------------------------------------
 * Stage: views, variants, playback controls and captions.
 * ------------------------------------------------------------------------- */

export type CourtView = 'top' | 'side'

interface StageProps {
  setId: string
  variant?: number
  onVariant?: (i: number) => void
  showVariants?: boolean
  onCue?: (cue: number | undefined) => void
  initialView?: CourtView
  /** Hide the controls for small previews. */
  compact?: boolean
}

export function CourtStage({ setId, variant = 0, onVariant, showVariants = false, onCue, initialView = 'top', compact = false }: StageProps) {
  const set = getSceneSet(setId)
  const scene = set.variants[variant] ?? set.variants[0]
  const rootRef = useRef<HTMLDivElement>(null)
  const pb = usePlayback(scene, rootRef)
  const f = useFrame(scene, pb.t)
  const [view, setView] = useState<CourtView>(initialView)
  const caption = captionAt(scene, pb.t)
  const counter = counterAt(scene, pb.t)

  const cue = caption?.cue
  useEffect(() => onCue?.(cue), [cue, onCue])

  return (
    <div ref={rootRef}>
      {showVariants && set.variants.length > 1 && (
        <LayoutGroup id={`variants-${setId}`}>
          <div className="chips" role="group" aria-label="Show a version" style={{ paddingTop: 14, paddingBottom: 12 }}>
            {set.variants.map((v, i) => (
              <button key={v.id} className="chip" aria-pressed={i === variant} onClick={() => onVariant?.(i)}>
                {i === variant && <motion.span layoutId="chip-bg" className="chip-bg" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <span>
                  <span className="dot" style={{ background: i === 0 ? 'var(--good)' : 'var(--bad)' }} />
                  {v.label}
                </span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      )}

      <div className={`stage ${view}`}>
        {view === 'top' ? <TopView scene={scene} f={f} /> : <SideView scene={scene} f={f} />}

        {!compact && (
          <div className="stage-view">
            <Segmented
              id={`view-${setId}`}
              value={view}
              options={[{ value: 'top', label: 'Above' }, { value: 'side', label: 'Side' }]}
              onChange={(v) => setView(v as CourtView)}
            />
          </div>
        )}

        {counter && (
          <div className={`stage-counter ${counter.tone ?? ''}`} aria-live="polite">
            <motion.b key={`${counter.t}`} initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
              {counter.value}
            </motion.b>
            <span>in a row</span>
          </div>
        )}

        {!compact && (
          <div className="stage-caption" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {caption && (
                <motion.div
                  key={caption.text}
                  className={`pill ${caption.tone ?? ''}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {caption.tone === 'good' && <Icon name="check" size={18} />}
                  {caption.tone === 'bad' && <Icon name="x" size={18} />}
                  {caption.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {!compact && (
        <div className="controls">
          <button className="play-btn" onClick={pb.toggle} aria-label={pb.playing ? 'Pause' : 'Play'}>
            <Icon name={pb.playing ? 'pause' : 'play'} size={20} />
          </button>
          <input
            className="scrub" type="range" min={0} max={scene.duration} step={0.01} value={pb.t}
            aria-label="Scrub through the shot"
            onChange={(e) => { pb.setPlaying(false); pb.seek(Number(e.target.value)) }}
          />
          <button className="speed" onClick={() => pb.setSpeed(pb.speed === 1 ? 0.5 : 1)} aria-label="Playback speed">
            {pb.speed === 1 ? '1×' : '½×'}
          </button>
        </div>
      )}
    </div>
  )
}

export function Segmented({ id, value, options, onChange }: { id: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <LayoutGroup id={id}>
      <div className="seg" role="group">
        {options.map((o) => (
          <button key={o.value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
            {o.value === value && <motion.span layoutId="seg-bg" className="seg-bg" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  )
}
