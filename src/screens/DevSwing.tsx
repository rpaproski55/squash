import { useCallback, useEffect, useRef, useState } from 'react'
import { CAMERAS } from '../anim/camera'
import { FOREHAND_DRIVE } from '../anim/figure/clips'
import { placeFigure, solveFigure } from '../anim/figure/solve'
import { strikeTime } from '../anim/render/canvas'
import { STRAIGHT_DRIVE } from '../anim/scenes/straightDrive'
import type { CameraId, Vec3 } from '../anim/types'
import { Segmented } from '../ui/CourtStage'
import { Icon } from '../ui/Icon'
import { hashParams, href } from '../ui/router'
import { useStageCanvas } from '../ui/useStageCanvas'

/*
 * Dev page for the figure: #/dev/swing
 * Query: ?t=2.0 freezes on a scene time, &cam=quarterClose, &theme=dark, &skel=1,
 * &v=good|short|loose|long|none picks a straight drive variant (none = figure only).
 * window.__seek(t, cam?) jumps to a scene time for screenshots, as in the prototype.
 * Scene time matches the prototype: the strike is at 2.0.
 */

const STRIKE = 2.0
const ANCHOR = { x: 5.6, y: 8.4 }
const CONTACT: Vec3 = [5.6, 8.4, 0.55]
const clip = FOREHAND_DRIVE
const T0 = STRIKE + clip.start
const T1 = STRIKE + clip.end

export function DevSwing() {
  const q = hashParams()
  const frozen = q.has('t')
  const t = useRef(frozen ? Number(q.get('t')) : T0)
  const [cam, setCam] = useState<CameraId>((q.get('cam') as CameraId) in CAMERAS ? (q.get('cam') as CameraId) : 'quarterClose')
  const [playing, setPlaying] = useState(!frozen)
  const [skeleton, setSkeleton] = useState(q.get('skel') === '1')
  const [speed, setSpeed] = useState(1)
  const [shown, setShown] = useState(t.current)
  const [variant, setVariant] = useState(q.get('v') ?? 'none')
  const scene = STRAIGHT_DRIVE.variants.find((v) => v.id === variant)
  const strike = scene ? strikeTime(scene) : STRIKE

  useEffect(() => {
    const theme = q.get('theme')
    if (theme) document.documentElement.setAttribute('data-theme', theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const draw = () => {
    const r = stage.renderer.current
    const colors = stage.colors.current
    if (!r || !colors) return
    const tau = t.current - strike
    r.draw({
      t: t.current, tau, camera: CAMERAS[cam], ball: CONTACT, scene,
      figures: [placeFigure(solveFigure(clip, tau), ANCHOR)],
      size: stage.size.current, colors, skeleton,
    })
  }
  const stage = useStageCanvas(draw)
  useEffect(draw)

  const seek = useCallback((v: number, c?: CameraId) => {
    setPlaying(false)
    t.current = v
    setShown(v)
    if (c) setCam(c)
  }, [])
  useEffect(() => {
    const w = window as unknown as { __seek?: typeof seek }
    w.__seek = seek
    return () => { delete w.__seek }
  }, [seek])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let lastShown = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t.current += dt * speed
      if (t.current > (scene ? scene.duration : T1) + 0.4) t.current = scene ? 0 : T0
      draw()
      if (now - lastShown > 100) { setShown(t.current); lastShown = now }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // draw reads cam and skeleton
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, cam, skeleton, variant])

  const toggleTheme = () => {
    const root = document.documentElement
    const dark = root.getAttribute('data-theme') === 'dark' || (!root.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches)
    root.setAttribute('data-theme', dark ? 'light' : 'dark')
  }

  return (
    <div>
      <div className="topbar">
        <a className="icon-btn" href={href()} aria-label="Back to today"><Icon name="back" /></a>
        <span className="title-m">Dev: swing</span>
      </div>
      <div className="screen stack">
        <div className="chips">
          {['none', ...STRAIGHT_DRIVE.variants.map((v) => v.id)].map((id) => (
            <button key={id} className={`chip ${id === variant ? 'on' : ''}`} aria-pressed={id === variant} onClick={() => setVariant(id)}>
              <span>{id}</span>
            </button>
          ))}
        </div>
        <div className="card flush">
          <div className="stage-canvas">
            <canvas ref={stage.canvasRef} role="img" aria-label="Forehand drive figure" />
            <div className="stage-view">
              <Segmented
                id="dev-cam" value={cam} onChange={(v) => setCam(v as CameraId)}
                options={[{ value: 'quarterWide', label: 'Wide' }, { value: 'quarterClose', label: 'Close' }, { value: 'behind', label: 'Behind' }, { value: 'top', label: 'Above' }]}
              />
            </div>
          </div>
          <div className="controls">
            <button className="play-btn" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
              <Icon name={playing ? 'pause' : 'play'} size={20} />
            </button>
            <input
              className="scrub" type="range" min={scene ? 0 : T0} max={scene ? scene.duration : T1} step={0.005} value={shown} aria-label="Scene time"
              onChange={(e) => seek(Number(e.target.value))}
            />
            <button className="speed" onClick={() => setSpeed(speed === 1 ? 0.25 : 1)}>{speed === 1 ? '1×' : '¼×'}</button>
          </div>
        </div>
        <p className="faint">
          Scene time {shown.toFixed(2)} s · contact time {(shown - strike).toFixed(2)} s · camera {cam}
        </p>
        <div className="row">
          <button className="btn btn-ghost" onClick={() => setSkeleton((s) => !s)}>{skeleton ? 'Hide' : 'Show'} skeleton</button>
          <button className="btn btn-ghost" onClick={toggleTheme}>Light / dark</button>
        </div>
      </div>
    </div>
  )
}
