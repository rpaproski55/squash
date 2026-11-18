# Architecture

Reference implementation: the `<script id="core">` block in
`prototypes/straight-drive.html`. It has no DOM access and ports to
TypeScript almost line for line. The second script block is the renderer.

## Decisions

| Question | Decision | Why |
|---|---|---|
| Figure data | Per-channel keyframe **tracks** driving a small **3D skeleton**, limbs solved by two-bone IK | Feet and hands are placed, not hoped for: a planted foot cannot slide and the racquet head can be put on the ball exactly. Angles-only rigs make both of those trial and error. |
| Cameras | One **pinhole camera** model for every view, including the top view | New views are data. The scenes are already 3D. |
| Renderer | **Canvas 2D**, drawn imperatively from a `requestAnimationFrame` loop; React owns only the shell | About 45 shapes change geometry and paint order every frame. In SVG through React that is 45 reconciled elements plus re-sorting DOM nodes for depth, per frame, on a phone. Canvas is one bitmap and painter's order is free. |
| Slow motion | A **pace track** on the director (rate against scene time). Scene data stays in scene time | Ball maths and tests are untouched. |
| Time base for poses | **Clip time, relative to contact** | A clip is reusable in any scene; the scene says when contact is. |
| Handedness | A **mirror** flag on clip placement | One boolean, no duplicated data. |
| Dependencies | **None added** | The maths is about 250 lines. |

Accessibility with canvas: the canvas gets `role="img"` and a label from the
scene; captions, cue highlighting and controls stay in the DOM as today.

## Coordinate conventions

- Court space, metres: x across (0 left wall, 6.4 right wall), y depth
  (0 front wall, 9.75 back wall), z up. **This is a left-handed system.**
  Screen-right for a camera is `cross(up, forward)`, not `cross(forward, up)`.
  Getting this wrong mirrors the court and turns the player left-handed; it
  happened in the prototype and there is a test for it below.
- Clip frame: origin on the floor directly under the contact point. `u` toward
  the side wall the shot runs along, `v` toward the back wall, `z` up. Placing
  a clip: `court = (anchor.x + s*u, anchor.y + v, z)`, `s = -1` when mirrored.
- Yaw, degrees: 0 faces the front wall, 90 faces the +u side wall. Forward is
  `(sin yaw, -cos yaw, 0)`, the body's right is `(cos yaw, sin yaw, 0)`.
- Chest frame `[right, forward, up]`: origin midway between the shoulders,
  axes from `chestYaw` only (up is world up; lean does not tilt the frame).
  Hands, racquet direction, racquet face and the elbow hint are authored here,
  so turning the chest carries the arm with it, as in a real swing.

## Types (`src/anim/types.ts`, additions)

```ts
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
}

export interface Player {
  id: string
  role: 'you' | 'opponent'
  label: string
  /** Players with motion get a full figure. */
  motion?: ClipPlacement[]
  /** Kept for players without a clip (an opponent drawn as a marker). */
  keys?: PlayerKey[]
}

/** Solved skeleton, court space. This is what any renderer draws, 2D or 3D. */
export interface Limb { root: Vec3; mid: Vec3; end: Vec3; stretch: number }
export interface FigurePose {
  pelvis: Vec3; chest: Vec3; head: Vec3
  shoulderL: Vec3; shoulderR: Vec3; hipL: Vec3; hipR: Vec3
  legL: Limb & { heel: Vec3; toe: Vec3 }
  legR: Limb & { heel: Vec3; toe: Vec3 }
  armL: Limb
  armR: Limb
  racquet: { hand: Vec3; head: Vec3; butt: Vec3; dir: Vec3; face: Vec3 }
}

export interface Camera { pos: Vec3; target: Vec3; /** horizontal, degrees */ fov: number; up?: Vec3 }
export type CameraId = 'quarterWide' | 'quarterClose' | 'behind' | 'top'

/** Times are relative to the scene's first 'strike' event. */
export interface Director {
  camera: { t: number; cam: CameraId; ease?: 'cut' | 'move' }[]
  pace: Track<number>
}

export interface Caption {
  t: number
  text: string
  cue?: number
  tone?: 'good' | 'bad'
  /** On-court highlight shown with this caption. */
  mark?: 'racquet' | 'foot' | 'contact'
}

export interface Scene {
  // existing fields unchanged, plus:
  director?: Director   // falls back to the SceneSet's, then to DEFAULT_DIRECTOR
}
```

(`Limb` uses `root/mid/end`; the prototype names them `hip/knee/ankle` and
`shoulder/elbow/hand`. Either is fine, pick one.)

## Sampling

Three samplers, all pure:

- `sampleTrack(track, t)`: monotone cubic per component (Fritsch-Carlson
  tangents with time weighting). Smooth, never overshoots, and two equal
  neighbouring keys give an exact hold. Used for everything except the three
  arc tracks. This is why a foot key repeated at the start and end of a stance
  phase is a guaranteed plant.
- `sampleArc(track, t)`: for unit vectors. Interpolates total angle travelled
  as one monotone cubic scalar, then slerps inside the segment. A key tagged
  `'peak'` gets a tangent of 1.5 times the faster neighbouring rate (capped at
  3 times the slower), which puts the fastest rotation on that key. Without
  this the racquet visibly slows down as it reaches the ball.
- `sampleLinear(track, t)`: for pace.

Foot lift is not authored. While a foot track is between two different
positions, `lift = 0.13 * min(1, distance / 0.8) * sin(pi * k)`.

## Solving the figure (`solveFigure(clip, tau)`)

1. Sample the feet. Pelvis floor position = midpoint of the feet +
   `pelvisOffset`; height from `pelvisHeight`. Deriving it from the feet is
   what keeps both legs in reach without hand tuning.
2. Chest = pelvis + spine (0.48) leaned by `lean` along `chestYaw`. Head =
   chest + 0.23 along the spine direction at 0.6 of the lean.
3. Hips = pelvis +/- 0.10 along the hip right vector; shoulders = chest +/- 0.19
   along the chest right vector.
4. Legs: two-bone IK hip to ankle (ankle 0.08 above the foot point). Knee pole
   = normalise(0.6 hip forward + 0.6 toe forward + 0.25 up).
5. Arms: two-bone IK shoulder to hand. Racquet elbow pole from `elbowR`; off
   arm pole fixed at chest-frame (-0.5, -0.3, -0.8).
6. Racquet: direction and face from the arc tracks; face is re-squared against
   the direction. Head centre = hand + 0.50 along the direction.
7. `ik2` clamps: if a target is out of reach the end is pulled in and
   `stretch > 1` is reported. Tests keep stretch under 1.04.

`placeFigure(pose, anchor, mirror)` maps to court space.

## Projection (`src/anim/camera.ts`)

```ts
const fw = normalise(target - pos)
const rt = normalise(cross(up ?? [0,0,1], fw))   // left-handed court space
const upv = cross(fw, rt)
const focal = (width / 2) / tan(fov / 2)
// per point:
const c = [dot(p - pos, rt), dot(p - pos, upv), dot(p - pos, fw)]
screen = { x: width/2 + focal*c[0]/c[2], y: height/2 - focal*c[1]/c[2], depth: c[2], scale: focal/c[2] }
```

`scale` is pixels per metre at that point; limb radii and the ball use it.
All four cameras sit outside the court, so nothing is ever behind the lens and
no clipping is needed. If a camera is ever placed inside the court, add
near-plane clipping to `poly` and `line3` first.

Camera blending (`lerpCam`): position and FOV by `k`, look-at by `k*k`,
`k = easeInOutCubic`.

## Renderer (`src/anim/render/`)

```ts
export interface FrameState {
  scene: Scene
  t: number                // scene time
  camera: Camera
  figures: FigurePose[]
  ball: Vec3 | null
  size: { w: number; h: number }
  colors: Record<string, string>   // resolved tokens
}
export interface StageRenderer {
  resize(w: number, h: number, dpr: number): void
  draw(frame: FrameState): void
  dispose(): void
}
```

`CourtStage.tsx` becomes a shell: it owns the clock, the controls, the caption
strip and a `<canvas>`, builds a `FrameState` each frame and hands it to a
`StageRenderer`. A later WebGL or video renderer implements the same
interface and reads the same `FigurePose`. React state changes only when the
caption, the play state or the scrubber position (throttled) changes, never
per frame.

Paint order per frame: stage fill, floor, walls the camera is inside of, wall
and floor lines, zones, figure and ball shadows, highlights, then figure parts
sorted far to near with the ball slotted in by depth, then marks.

Resolve colours from the CSS tokens with `getComputedStyle` once on mount and
on theme change, not per frame. Device pixel ratio capped at 3.

Suggested files:

```
src/anim/tracks.ts            sampleTrack, sampleArc, sampleLinear
src/anim/figure/body.ts       BODY dimensions and limb radii
src/anim/figure/solve.ts      ik2, footAt, solveFigure, placeFigure, figureAt(player, t)
src/anim/figure/clips/forehandDrive.ts
src/anim/camera.ts            CAMERAS, makeProjector, lerpCam
src/anim/director.ts          DEFAULT_DIRECTOR, directedCamera, paceAt
src/anim/render/canvas.ts     CanvasStageRenderer
src/ui/CourtStage.tsx         shell
```

## Scene changes

- **Lead-in.** The figure needs 2.0 s of scene time before contact to split
  step and take four steps; the existing scenes give 1.2 s. Add 0.8 s to every
  time in the straight drive scenes (strike moves from 1.2 to 2.0). The ball
  does not exist before its first waypoint, so the first 0.8 s shows the
  player ready on the T. All pose numbers are relative to the strike, so this
  shift does not change them. The existing tests do not depend on absolute
  times.
- **Player motion.** `YOU` becomes
  `{ motion: [{ clip: 'forehand-drive-classic', at: STRIKE, anchor: { x: 5.6, y: 8.4 } }] }`.
  The hand-written `keys` for `you` go away; anything that needs a floor
  position (the Above view, tests) reads the solved pelvis. One source of truth.
- **Captions** take the times and `mark` values from `DIRECTION.md`.
- **Drill scene.** One placement per swing with `from: -0.62, to: 0.42`.
  Between placements, blend channel values (sample both placements' tracks at
  their clamped times, lerp with smoothstep over 0.15 s) before solving.

## Handedness, backhand, open stance

- Left-hander: `mirror: true` on the placement and mirror the ball data in x
  (`x -> 6.4 - x`). A `mirrorScene(scene)` helper does both. The figure code
  needs nothing else: `placeFigure` flips u and the renderer tints whichever
  arm holds the racquet. Format supports it now; build and test it later.
- Backhand drive: a new clip authored along the left wall (anchor near x 0.8).
  Same tracks, same solver.
- Open stance: a second clip, `forehand-drive-open`, same contact numbers,
  different foot and hip tracks. A scene picks the clip by id.
- Other contact heights (volley, low pickup): clips are solved for one
  `contactHeight`. Do not stretch a clip to a different height; author another.

## Tests (Vitest, `src/anim/figure.test.ts` and additions)

1. **Contact.** For every placement in every scene: racquet head centre is
   within 0.03 m of `ballAt(strike)`. Prototype: 0.0006 m.
2. **Square face.** At contact the string normal is within 20 degrees of
   pointing at the front wall and tilted up between 5 and 25 degrees.
3. **Reach.** Over the whole clip at 5 ms steps, every limb `stretch <= 1.04`.
4. **Planted feet.** Between two equal consecutive foot keys the solved ankle
   moves less than 1 mm on the floor.
5. **Racquet speed.** Head speed at contact is at least 90 percent of the
   maximum over the swing, and the maximum falls within 0.03 s of contact.
6. **Racquet up early.** At tau -1.3 the racquet head is above the hand and
   above 1.5 m.
7. **Side-on at contact.** Chest yaw between 60 and 90; front toe yaw between
   75 and 95; front ankle within 0.1 m of the ball in y.
8. **Recovery.** At clip end the pelvis is within 0.05 m of the T stance.
9. **Camera handedness.** In `behind`, x = 6.4 projects to the right of x = 0.
   In `top`, y = 0 projects above y = 9.75 and x = 6.4 to the right of x = 0.
10. **Framing.** In the directed sequence, at 20 sampled times, the pelvis and
    the ball (when present) project inside the 358 x 400 stage. During the
    camera move only the pelvis is required.
11. **Pace.** Never below 0.05, never above 1.
12. Existing ball tests keep passing after the 0.8 s shift.

## Performance budget

Per frame: one `solveFigure` (about 40 track samples, 4 IK solves), about 45
canvas paths. The prototype holds 60 fps in headless Chromium at 390 px; that
is a desktop number, so step 6 of the plan checks a real phone. If a phone
drops frames, the first cut is the dotted ball path (cache its points per
scene instead of resampling every frame).
