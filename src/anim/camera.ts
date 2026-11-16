import type { Camera, CameraId, Vec3 } from './types'
import { RAD, V } from './vec'

/*
 * One pinhole camera model for every view, ported from the prototype core
 * block. fov is the horizontal field of view in degrees. up defaults to +z;
 * the top view uses up = -y so the front wall is at the top of the screen.
 */
export const CAMERAS: Record<CameraId, Camera> = {
  quarterWide: { pos: [12.7, 14.5, 2.3], target: [4.3, 7.4, 0.85], fov: 27 },
  quarterClose: { pos: [11.8, 14.1, 1.9], target: [4.9, 8.3, 0.92], fov: 20 },
  behind: { pos: [4.6, 17.0, 3.9], target: [5.0, 0, -0.4], fov: 30 },
  top: { pos: [3.2, 4.55, 30], target: [3.2, 4.55, 0], fov: 18.5, up: [0, -1, 0] },
}

/**
 * Blend two cameras. k is 0..1 (already eased). The look-at point trails the
 * position (k squared) so the subject stays in frame while the camera travels.
 */
export function lerpCam(a: Camera, b: Camera, k: number): Camera {
  return { pos: V.lerp(a.pos, b.pos, k), target: V.lerp(a.target, b.target, k * k), fov: a.fov + (b.fov - a.fov) * k, up: a.up || b.up }
}

export interface ScreenPoint {
  x: number
  y: number
  /** Distance along the view direction, metres. */
  depth: number
  /** Pixels per metre at this point. */
  scale: number
}

export interface Projector {
  project: (p: Vec3) => ScreenPoint
  /** Camera space: [right, up, forward]. */
  toCam: (p: Vec3) => Vec3
  focal: number
  cam: Camera
}

/** Build a projector for a camera and a viewport of w by h pixels. */
export function makeProjector(cam: Camera, w: number, h: number): Projector {
  const fw = V.norm(V.sub(cam.target, cam.pos))
  // Court space is left-handed (x right, y toward the viewer at the back, z up), so screen-right is up x forward.
  const rt = V.norm(V.cross(cam.up || [0, 0, 1], fw))
  const upv = V.cross(fw, rt)
  const focal = (w / 2) / Math.tan((cam.fov * RAD) / 2)
  const toCam = (p: Vec3): Vec3 => {
    const d = V.sub(p, cam.pos)
    return [V.dot(d, rt), V.dot(d, upv), V.dot(d, fw)]
  }
  const project = (p: Vec3): ScreenPoint => {
    const c = toCam(p)
    const z = Math.max(c[2], 0.05)
    return { x: w / 2 + (focal * c[0]) / z, y: h / 2 - (focal * c[1]) / z, depth: c[2], scale: focal / z }
  }
  return { project, toCam, focal, cam }
}
