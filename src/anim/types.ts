/**
 * Declarative animation format.
 *
 * A scene is pure data: ball waypoints in 3D court space, players (a figure
 * clip placed in the scene), zones and captions on a timeline. Renderers (the
 * canvas stage today, perhaps WebGL or video later) read the same data and
 * decide how to draw it.
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
}

export interface Player {
  id: string
  role: 'you' | 'opponent'
  label: string
  /** Players with motion get a full figure. */
  motion?: ClipPlacement[]
  /** Kept for players without a clip (the drill, an opponent drawn as a marker). */
  keys?: PlayerKey[]
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
  /** On-court highlight shown with this caption. */
  mark?: 'racquet' | 'foot' | 'contact'
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
  /** Colour of the shot's dotted path: 'good' for the model version, 'bad' for a miss. */
  tone?: 'good' | 'bad'
  /** Camera sequence and pace; falls back to the SceneSet's, then to DEFAULT_DIRECTOR. */
  director?: Director
  /** Optional on-court counter (drills). */
  counter?: { t: number; value: number; tone?: 'good' | 'bad' }[]
}

export interface SceneSet {
  id: string
  director?: Director
  /** Variants, the first is the default ("the good version"). */
  variants: Scene[]
}

/* ---------------------------------------------------------------------------
 * Figure, cameras and direction (docs/animation/ARCHITECTURE.md).
 * Ported from the core block of docs/animation/prototypes/straight-drive.html.
 * ------------------------------------------------------------------------- */

export type Vec2 = [number, number]
export type Vec3 = [number, number, number]

/** [time, value] or [time, value, 'peak']. 'peak' is only read by arc tracks. */
export type Key<T> = [t: number, value: T] | [t: number, value: T, tag: 'peak']
export type Track<T> = Key<T>[]

export interface FigureTracks {
  /** Added to the midpoint of the two feet to give the pelvis floor position. */
  pelvisOffset: Track<Vec2>
  pelvisHeight: Track<number>
  hipYaw: Track<number>
  chestYaw: Track<number>
  /** Forward lean of the spine along chestYaw, degrees. */
  lean: Track<number>
  /** Ankle positions on the floor in the clip frame. Lift is automatic. */
  footL: Track<Vec2>
  footR: Track<Vec2>
  toeL: Track<number>
  toeR: Track<number>
  /** Racquet-hand wrist, chest frame. 'R' means the racquet side of a right-hander. */
  handR: Track<Vec3>
  handL: Track<Vec3>
  /** Wrist to racquet head, chest frame. Arc track. */
  racquetDir: Track<Vec3>
  /** Normal of the strings, chest frame. Arc track. */
  racquetFace: Track<Vec3>
  /** Direction the racquet elbow bends toward, chest frame. Arc track. */
  elbowR: Track<Vec3>
}

export interface FigureClip {
  id: string
  stroke: 'forehand' | 'backhand'
  stance: 'classic' | 'open'
  /** Height of the ball at contact this clip is solved for. */
  contactHeight: number
  /** First and last clip time. Contact is 0. */
  start: number
  end: number
  tracks: FigureTracks
}

/** Where and when a clip plays in a scene. */
export interface ClipPlacement {
  clip: string
  /** Scene time of contact. */
  at: number
  /** Floor point under the contact, court space. */
  anchor: { x: number; y: number }
  /** Flip across the court's long axis and swap left and right limbs. */
  mirror?: boolean
  /** Play only this window of clip time (drills repeat the swing without the walk in). */
  from?: number
  to?: number
  /** Replace keys of the clip at matching times (insert where there is none): a miss shows its body fault. */
  overrides?: Partial<FigureTracks>
}

/** Solved skeleton. Limbs keep the prototype's joint names. This is what any renderer draws, 2D or 3D. */
export interface Leg { hip: Vec3; knee: Vec3; ankle: Vec3; heel: Vec3; toe: Vec3; stretch: number }
export interface Arm { shoulder: Vec3; elbow: Vec3; hand: Vec3; stretch: number }
export interface Racquet { hand: Vec3; head: Vec3; butt: Vec3; dir: Vec3; face: Vec3 }
export interface FigurePose {
  pelvis: Vec3
  chest: Vec3
  head: Vec3
  shoulderL: Vec3
  shoulderR: Vec3
  hipL: Vec3
  hipR: Vec3
  legL: Leg
  legR: Leg
  armL: Arm
  armR: Arm
  racquet: Racquet
}

export interface Camera {
  pos: Vec3
  target: Vec3
  /** Horizontal field of view, degrees. */
  fov: number
  up?: Vec3
}
export type CameraId = 'quarterWide' | 'quarterClose' | 'behind' | 'top'

/** Times are relative to the scene's first 'strike' event. */
export interface Director {
  camera: { t: number; cam: CameraId; ease?: 'cut' | 'move' }[]
  pace: Track<number>
}
