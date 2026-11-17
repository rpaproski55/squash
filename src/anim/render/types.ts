import type { Camera, FigurePose, Scene, Vec3 } from '../types'
import type { StageColors } from './colors'

/** Everything a renderer needs for one frame. A WebGL or video renderer would read the same thing. */
export interface FrameState {
  /** Scene time. */
  t: number
  /** Time relative to the strike (contact = 0). */
  tau: number
  camera: Camera
  figures: FigurePose[]
  /** The scene, when there is one (zones, ball, marks). */
  scene?: Scene
  /** A lone ball position to draw when there is no scene (the dev swing page). */
  ball?: Vec3 | null
  size: { w: number; h: number }
  colors: StageColors
  /** Debug: draw the bones over the figure. */
  skeleton?: boolean
  /** 0..1 fade through the stage colour (loop restart). */
  fade?: number
  /** Reduced motion: marks appear without the ring or the pop. */
  reduced?: boolean
}

export interface StageRenderer {
  resize(w: number, h: number, dpr: number): void
  draw(frame: FrameState): void
  dispose(): void
}
