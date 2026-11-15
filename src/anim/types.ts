/**
 * Declarative animation format.
 *
 * A scene is pure data: ball waypoints in 3D court space, player keyframes,
 * zones and captions on a timeline. Renderers (the SVG views today, perhaps a
 * 3D player later) read the same data and decide how to draw it.
 *
 * Court space, in metres, for a right-handed player:
 *   x: across the court, 0 = left wall, 6.4 = right wall (facing the front wall)
 *   y: depth, 0 = front wall, 9.75 = back wall
 *   z: height above the floor
 */

export type BallEvent = 'feed' | 'strike' | 'front' | 'bounce' | 'side' | 'back' | 'roll' | 'stop'

export interface BallPoint {
  t: number
  x: number
  y: number
  z: number
  /** What happens at this point. 'roll' means the segment ending here runs along the floor. */
  event?: BallEvent
  /** Marks a point the viewer should notice (drawn as a marker when reached). */
  mark?: 'good' | 'bad' | 'info'
}

export interface PlayerKey {
  t: number
  x: number
  y: number
  /** A swing that peaks at this keyframe. */
  swing?: 'forehand' | 'backhand'
}

export interface Player {
  id: string
  role: 'you' | 'opponent'
  label: string
  keys: PlayerKey[]
}

export type Zone =
  | { id: string; kind: 'target' | 'danger'; surface: 'floor'; x: number; y: number; w: number; h: number; label?: string }
  | { id: string; kind: 'target' | 'danger'; surface: 'front'; x: number; z: number; w: number; h: number; label?: string }

export interface Caption {
  t: number
  text: string
  /** Index into the skill's cue list, so the page can highlight it. */
  cue?: number
  tone?: 'good' | 'bad'
}

export interface Scene {
  id: string
  label: string
  duration: number
  /** Gravity used for arcs, in m/s^2 of scene time. Scenes run slower than real life, so this is lower than 9.8. */
  gravity: number
  ball: BallPoint[]
  players: Player[]
  zones: Zone[]
  captions: Caption[]
  /** Optional on-court counter (drills). */
  counter?: { t: number; value: number; tone?: 'good' | 'bad' }[]
}

export interface SceneSet {
  id: string
  /** Variants, the first is the default ("the good version"). */
  variants: Scene[]
}
