import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cameraFor, directorFor, paceAt, type ViewMode } from '../anim/director'
import { figureAt } from '../anim/figure/figureAt'
import { strikeTime } from '../anim/render/canvas'
import { getSceneSet } from '../anim/scenes'
import { captionAt, counterAt } from '../anim/trajectory'
import type { Caption, FigurePose, Scene, SceneSet } from '../anim/types'
import { Icon } from './Icon'
import { useStageCanvas } from './useStageCanvas'

/*
 * The court stage: a shell around the canvas renderer. It owns the clock,
 * the controls and the caption strip. Per frame it builds a FrameState and
 * draws; React state changes only for the caption, play state, view and
 * variant, never per frame. Motion and framing follow
 * docs/animation/prototypes/straight-drive.html.
 */

const VIEWS: { value: ViewMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'swing', label: 'Swing' },
  { value: 'behind', label: 'Behind' },
  { value: 'top', label: 'Above' },
]
/** Fade through the stage colour before the loop restarts, and the rest after it. */
const FADE = 0.25
const REST = 0.5

interface StageProps {
  setId: string
  variant?: number
  onVariant?: (i: number) => void
  showVariants?: boolean
  onCue?: (cue: number | undefined) => void
  /** Small preview: Auto sequence, no controls, no caption. Plays once when scrolled into view, then holds the last frame. */
  compact?: boolean
}

export function CourtStage({ setId, variant = 0, onVariant, showVariants = false, onCue, compact = false }: StageProps) {
  const set: SceneSet = getSceneSet(setId)
  const scene: Scene = set.variants[variant] ?? set.variants[0]
  const reduced = useReducedMotion() ?? false
  const director = directorFor(scene, set)
  const strike = strikeTime(scene)

  // Reduced motion: hold the contact pose in the Swing view (quarterClose at contact), no autoplay.
  const [mode, setMode] = useState<ViewMode>(reduced && !compact && director.camera.length > 1 ? 'swing' : 'auto')
  const [playing, setPlaying] = useState(!reduced)
  const [speed, setSpeed] = useState(1)
  const [caption, setCaption] = useState<Caption | null>(null)
  const [counter, setCounter] = useState<ReturnType<typeof counterAt>>(null)
  // A director with one camera (the drill) has no views to choose from.
  const fixedView = director.camera.length === 1

  const t = useRef(reduced ? strike : 0)
  const fade = useRef(0)
  const scrubbing = useRef(false)
  const scrubRef = useRef<HTMLInputElement>(null)
  const live = useRef({ scene, mode, speed, playing, reduced, director, strike })
  live.current = { scene, mode, speed, playing, reduced, director, strike }

  const draw = () => {
    const { scene, mode, reduced, director, strike } = live.current
    const r = stage.renderer.current
    const colors = stage.colors.current
    if (!r || !colors) return
    const tau = t.current - strike
    const figures = scene.players.map((p) => figureAt(p, t.current)).filter((f): f is FigurePose => !!f)
    r.draw({
      t: t.current, tau, scene, figures, colors, reduced,
      camera: cameraFor(mode, director, tau, reduced),
      size: stage.size.current,
      fade: fade.current,
    })
    const cap = captionAt(scene, t.current)
    setCaption((prev) => (prev === cap ? prev : cap))
    const cnt = counterAt(scene, t.current)
    setCounter((prev) => (prev === cnt ? prev : cnt))
    if (scrubRef.current && !scrubbing.current) scrubRef.current.value = String(t.current)
  }
  const stage = useStageCanvas(draw)

  // A new variant starts from the top with a short fade in.
  useEffect(() => {
    t.current = reduced ? strike : 0
    fade.current = reduced ? 0 : 1
    setPlaying(!reduced)
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  useEffect(() => draw())

  // Pause while scrolled out of view.
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = stage.canvasRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: compact ? 0.5 : 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [stage.canvasRef])

  useEffect(() => {
    if (!playing || !visible) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { scene, mode, speed, reduced, director, strike } = live.current
      t.current += dt * paceAt(director, t.current - strike, mode) * speed
      const tail = scene.duration - t.current
      if (reduced || compact) {
        // Play once and stop on the last frame: no loop, no fade out. The fade in still clears.
        fade.current = reduced ? 0 : Math.max(0, fade.current - dt * 4)
        if (tail <= 0) {
          t.current = scene.duration
          setPlaying(false)
        }
      } else {
        fade.current = tail < FADE ? 1 - Math.max(0, tail) / FADE : Math.max(0, fade.current - dt * 4)
        if (t.current >= scene.duration + REST) t.current = 0
      }
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, visible])

  const toggle = () => {
    if (!playing && t.current >= scene.duration) t.current = 0
    setPlaying((p) => !p)
  }
  const seek = (v: number) => {
    setPlaying(false)
    fade.current = 0
    t.current = v
    draw()
  }

  // Test hook, as in the prototype: window.__seek(sceneTime, view?)
  const seekRef = useRef(seek)
  seekRef.current = seek
  useEffect(() => {
    if (compact) return
    // The first full stage on the page owns the hook (the skill page also has the drill's stage).
    const w = window as unknown as { __seek?: (t: number, m?: ViewMode) => void }
    if (w.__seek) return
    const hook = (v: number, m?: ViewMode) => {
      if (m) {
        live.current.mode = m
        setMode(m)
      }
      seekRef.current(v)
    }
    w.__seek = hook
    return () => { if (w.__seek === hook) delete w.__seek }
  }, [compact])

  const cue = caption?.cue
  useEffect(() => onCue?.(cue), [cue, onCue])

  const chooseMode = useCallback((m: string) => setMode(m as ViewMode), [])

  return (
    <div>
      {showVariants && set.variants.length > 1 && (
        <div style={{ padding: '14px 16px 12px' }}>
          <LayoutGroup id={`variants-${setId}`}>
            <div className="chips" role="group" aria-label="Show a version">
              {set.variants.map((v, i) => (
                <button key={v.id} className="chip" aria-pressed={i === variant} onClick={() => onVariant?.(i)}>
                  {i === variant && <motion.span layoutId="chip-bg" className="chip-bg" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                  <span>
                    <span className="dot" style={{ background: v.tone === 'bad' ? 'var(--bad)' : 'var(--good)' }} />
                    {v.label}
                  </span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </div>
      )}

      <div className="stage-canvas">
        <canvas ref={stage.canvasRef} role="img" aria-label={`Animation: ${scene.label}. ${caption?.text ?? ''}`} />
        {counter && (
          <div className={`stage-counter ${counter.tone ?? ''}`} aria-live="polite">
            <motion.b key={`${counter.t}`} initial={reduced ? false : { scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
              {counter.value}
            </motion.b>
            <span>in a row</span>
          </div>
        )}
        {!compact && !fixedView && (
          <div className="stage-view">
            <Segmented id={`view-${setId}`} value={mode} options={VIEWS} onChange={chooseMode} />
          </div>
        )}
      </div>

      {!compact && (
        <>
          <div className="caption-strip" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {caption && (
                <motion.div
                  key={caption.text}
                  className={`caption-text ${caption.tone ?? ''}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                >
                  {caption.tone === 'good' && <Icon name="check" size={18} />}
                  {caption.tone === 'bad' && <Icon name="x" size={18} />}
                  {caption.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="controls">
            <button className="play-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
              <Icon name={playing ? 'pause' : 'play'} size={20} />
            </button>
            <input
              ref={scrubRef}
              className="scrub" type="range" min={0} max={scene.duration} step={0.01} defaultValue={t.current}
              aria-label="Scrub through the shot"
              onPointerDown={() => { scrubbing.current = true }}
              onPointerUp={() => { scrubbing.current = false }}
              onChange={(e) => seek(Number(e.target.value))}
            />
            <button className="speed" onClick={() => setSpeed(speed === 1 ? 0.5 : 1)} aria-label="Playback speed">
              {speed === 1 ? '1×' : '½×'}
            </button>
          </div>
        </>
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
