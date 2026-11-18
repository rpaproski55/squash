import { CAMERAS, lerpCam } from './camera'
import { sampleLinear } from './tracks'
import type { Camera, Director, Scene, SceneSet } from './types'

/*
 * The directed sequence, ported from the prototype core. Camera keys and pace
 * keys are in seconds relative to the strike. ease: 'move' eases in and out
 * from the previous key; anything else holds the previous camera until the key.
 */
export const DEFAULT_DIRECTOR: Director = {
  camera: [
    { t: -2.0, cam: 'quarterWide' },
    { t: -1.55, cam: 'quarterWide' },
    { t: -0.62, cam: 'quarterClose', ease: 'move' },
    { t: 0.1, cam: 'quarterClose' },
    { t: 0.52, cam: 'behind', ease: 'move' },
  ],
  /** Playback rate against scene time: slow into the swing, near-freeze at contact. */
  pace: [[-2.0, 0.95], [-0.95, 0.95], [-0.45, 0.5], [-0.12, 0.32], [-0.025, 0.07], [0.03, 0.07], [0.1, 0.34], [0.5, 0.7], [0.85, 1.0]],
}

export const directorFor = (scene: Scene, set?: SceneSet): Director => scene.director ?? set?.director ?? DEFAULT_DIRECTOR

export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

/**
 * Camera at time tau. With cuts = true (reduced motion) a move becomes a cut at
 * the end of the move: the previous camera holds, then the new one appears.
 */
export function directedCamera(dir: Director, tau: number, cuts = false): Camera {
  const keys = dir.camera
  if (tau <= keys[0].t) return CAMERAS[keys[0].cam]
  let i = 0
  while (i < keys.length - 1 && keys[i + 1].t <= tau) i++
  if (i === keys.length - 1) return CAMERAS[keys[i].cam]
  const a = keys[i]
  const b = keys[i + 1]
  if (b.ease !== 'move' || cuts) return CAMERAS[a.cam]
  return lerpCam(CAMERAS[a.cam], CAMERAS[b.cam], easeInOut((tau - a.t) / (b.t - a.t)))
}

/** "Swing" mode: the directed camera up to the close-up, then eases back out to the wide framing for the recovery. */
export function swingCamera(dir: Director, tau: number, cuts = false): Camera {
  if (tau < -0.62) return directedCamera(dir, tau, cuts)
  if (tau <= 0.5) return CAMERAS.quarterClose
  if (cuts) return tau < 1.1 ? CAMERAS.quarterClose : CAMERAS.quarterWide
  const k = Math.min(1, (tau - 0.5) / 0.6)
  return lerpCam(CAMERAS.quarterClose, CAMERAS.quarterWide, easeInOut(k))
}

export type ViewMode = 'auto' | 'swing' | 'behind' | 'top'

export function cameraFor(mode: ViewMode, dir: Director, tau: number, cuts = false): Camera {
  if (mode === 'auto') return directedCamera(dir, tau, cuts)
  if (mode === 'swing') return swingCamera(dir, tau, cuts)
  return CAMERAS[mode]
}

/** Playback rate at tau. In the Above view the pace is floored at 0.6 (a slow-motion dot teaches nothing). */
export function paceAt(dir: Director, tau: number, mode: ViewMode = 'auto'): number {
  const p = sampleLinear(dir.pace, tau)
  return mode === 'top' ? Math.max(0.6, p) : p
}
