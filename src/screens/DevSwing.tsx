import { useEffect, useRef, useState } from 'react'
import { CAMERAS } from '../anim/camera'
import { FOREHAND_DRIVE } from '../anim/figure/clips/forehandDrive'
import { placeFigure, solveFigure } from '../anim/figure/solve'
import { CanvasStageRenderer, readStageColors, type StageColors } from '../anim/render/canvas'
import type { Vec3 } from '../anim/types'
import { Icon } from '../ui/Icon'
import { hashQuery } from '../ui/router'

/*
 * #/dev/swing: plan step 1. The ported figure on canvas from the quarterClose
 * camera, with play, a scrubber and the skeleton overlay, so the swing can be
 * checked against the prototype at the same scene time.
 *
 * Time is scene time with the strike at 2.0 s, as in the prototype after its
 * 0.8 s lead-in, so ?t=2.0 here and in the prototype show the same frame.
 * Playback runs at a constant rate: the pace track arrives with the director
 * in step 4. Test hooks: ?t=2.0 freezes on a time, ?theme=dark, ?skeleton=1,
 * window.__seek(t).
 */

const STRIKE = 2.0
const ANCHOR = { x: 5.6, y: 8.4 }
const CONTACT: Vec3 = [ANCHOR.x, ANCHOR.y, FOREHAND_DRIVE.contactHeight]
/** The clip ends at 3.9 s; hold the last frame for half a second, then loop. */
const DURATION = STRIKE + FOREHAND_DRIVE.end + 0.5

declare global {
  interface Window { __seek?: (t: number) => void }
}

export function DevSwing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrubRef = useRef<HTMLInputElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const q = hashQuery()
  const frozenAt = q.get('t')

  const [playing, setPlaying] = useState(!reduced && frozenAt === null)
  const [speed, setSpeed] = useState(1)
  const [skeleton, setSkeleton] = useState(q.get('skeleton') === '1')

  // Values the frame loop reads without re-rendering React.
  const live = useRef({ t: frozenAt !== null ? +frozenAt : reduced ? STRIKE : 0, playing, speed, skeleton, scrubbing: false })
  live.current.playing = playing
  live.current.speed = speed
  live.current.skeleton = skeleton
  const drawRef = useRef<() => void>(() => {})

  useEffect(() => {
    const theme = hashQuery().get('theme')
    if (theme === 'dark' || theme === 'light') document.documentElement.setAttribute('data-theme', theme)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current!
    const renderer = new CanvasStageRenderer(canvas)
    let colors: StageColors = readStageColors()
    const size = { w: 358, h: 400 }

    const draw = () => {
      const s = live.current
      const tau = s.t - STRIKE
      renderer.draw({
        t: s.t,
        camera: CAMERAS.quarterClose,
        figures: [placeFigure(solveFigure(FOREHAND_DRIVE, tau), ANCHOR)],
        ball: CONTACT,
        size,
        colors,
        skeleton: s.skeleton,
      })
      if (clockRef.current) clockRef.current.textContent = `t ${s.t.toFixed(2)} s · ${tau >= 0 ? '+' : '−'}${Math.abs(tau).toFixed(2)} from contact`
      if (scrubRef.current && !s.scrubbing) scrubRef.current.value = String(Math.round((s.t / DURATION) * 1000))
    }
    drawRef.current = draw

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      size.w = r.width
      size.h = r.height
      renderer.resize(r.width, r.height, window.devicePixelRatio || 1)
      draw()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const recolor = () => { colors = readStageColors(); draw() }
    const mo = new MutationObserver(recolor)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', recolor)

    let raf = 0, last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = live.current
      if (s.playing) {
        s.t += dt * s.speed
        if (s.t >= DURATION) s.t = 0
      }
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame((n) => { last = n; tick(n) })

    window.__seek = (t: number) => { setPlaying(false); live.current.playing = false; live.current.t = t; draw() }
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      mq.removeEventListener('change', recolor)
      renderer.dispose()
      delete window.__seek
    }
  }, [])

  const toggleTheme = () => {
    const root = document.documentElement
    const dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches)
    root.setAttribute('data-theme', dark ? 'light' : 'dark')
  }

  return (
    <div className="devswing">
      <h1>Swing check</h1>
      <div className="card">
        <div className="stage">
          <canvas ref={canvasRef} role="img" aria-label="Forehand straight drive, figure only, from behind the player's right shoulder" />
          <span className="clock" ref={clockRef} />
        </div>
        <div className="controls">
          <button
            className="play"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => {
              if (!playing && live.current.t >= DURATION) live.current.t = 0
              setPlaying(!playing)
            }}
          >
            <Icon name={playing ? 'pause' : 'play'} size={18} />
          </button>
          <input
            ref={scrubRef}
            type="range"
            min={0}
            max={1000}
            defaultValue={Math.round((live.current.t / DURATION) * 1000)}
            aria-label="Timeline"
            onInput={(e) => {
              live.current.scrubbing = true
              setPlaying(false)
              live.current.t = (+e.currentTarget.value / 1000) * DURATION
              drawRef.current()
            }}
            onChange={() => { live.current.scrubbing = false }}
            onPointerUp={() => { live.current.scrubbing = false }}
          />
          <button className="speed" onClick={() => setSpeed(speed === 1 ? 0.5 : 1)}>{speed === 1 ? '1×' : '½×'}</button>
        </div>
      </div>
      <div className="row">
        <button onClick={toggleTheme}>Light / dark</button>
        <button aria-pressed={skeleton} onClick={() => { setSkeleton(!skeleton); live.current.skeleton = !skeleton; drawRef.current() }}>
          Skeleton overlay
        </button>
      </div>
      <p className="note">
        Plan step 1: the figure ported from the prototype, floor and lines only, ball shown as a dot at the contact
        point. Time is scene time with contact at 2.00 s, matching the prototype.
      </p>
    </div>
  )
}
