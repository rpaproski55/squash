# Animation decisions

Running log. Newest at the bottom. Mark open questions for the owner with
**Open**.

- Owner: animation quality comes before step 3 of the build order.
- Owner: the top view does not work as a player's view. Keep it as a
  secondary angle since it is already built.
- Owner: start with a simple side-on figure and get the timing right before
  adding detail.
- Owner: planning, architecture and creative direction happen in a separate
  session; a different model implements them afterwards.

## Planning session, 2026-11-16

Owner answers:

- Footwork: teach the classic stance (left foot across) now; keep the format
  open for an open-stance clip later.
- Figure style: soft mannequin, hitting arm and racquet highlighted.
- Default view: a directed sequence that changes camera by itself, with
  manual views one tap away.
- Handedness: the owner is right-handed. Format supports left-handers now;
  build and test right-handed only in this round.

Decisions made by the planning session (reasons in the linked files):

- The body view is a rear-quarter camera, not the through-the-side-wall view
  the handoff proposed. From the side the racquet points at the lens at
  contact. (`DIRECTION.md`)
- Canvas 2D replaces SVG for the stage. No new dependencies.
  (`ARCHITECTURE.md`)
- The figure is a 3D skeleton solved from keyframe tracks with IK; the pelvis
  is derived from the feet. (`ARCHITECTURE.md`, `POSES.md`)
- Straight drive scenes get 0.8 s of lead-in so the figure has time to move.
  Poses are timed relative to the strike, so they hold for strike at 1.2 s or
  2.0 s. (`ARCHITECTURE.md`)
- Captions move from an overlay on the court to a strip under it.
- Miss variants keep the good swing until step 7 of the plan, and until then
  their captions describe only the ball. The old "Facing the front wall at
  contact" caption is removed because the figure does not show it.
- Court space is left-handed; the projection uses `cross(up, forward)` for
  screen-right. The first prototype had this backwards and mirrored the court.

Verified, and how:

- Prototype runs offline at 390 px with no network requests, no console
  errors, no horizontal scroll, 61 fps in headless Chromium. Still frames
  checked in light and dark for all four views and the "too hard" variant.
- Not verified: frame rate on a real phone; the motion judged by a person
  watching it play (it was checked frame by frame, and by measured racquet
  speed, reach and contact error).

**Open** for the owner:

- Is the swing right to your eye? Step 0 of `PLAN.md`. This is the one thing
  numbers cannot settle.
- The lesson text could be tightened on four points (contact position, wrist
  angle, compact follow-through, split step). See "Technique check" in
  `DIRECTION.md`. Content is out of scope for the animation work, so nothing
  was changed.
- Step 7 (misses that show the body fault) is the biggest teaching gain after
  the base swing, and the fault poses are my proposal, not checked with a
  coach. Worth a look before it is built.
- Scene pacing: the feed reaches the racquet in about half a real second. If
  the scenes are ever retimed to real ball speeds, the clip's approach should
  be re-authored with more, shorter steps.

## Build session, step 1, 2026-11-16

Worked on branch `claude/animation-core-port-step-1-vluirc`, started from
`claude/stoic-ramanujan-0f1qv5` at `b619bf5`.

Result: the `core` block is ported to `src/anim/` and is **bit-identical** to
the prototype. Checked by running the prototype's own core in Node next to the
port: every joint of every limb, every 5 ms from -2.05 to +1.95, and all four
camera projections, with zero difference. The POSES.md joint table matches to
0.01 m and 1 degree at all ten named poses.

Decisions made while porting:

- **Test 4 (planted feet) fails as written against the prototype's data.** The
  authored foot point holds exactly and never lifts, but in four of the ten
  plants the leg is briefly over-stretched (up to 1.034), so the IK clamp holds
  the ankle short of its floor point: 15.5 mm at the left-foot landing at
  t -1.05, 13 mm at the landing at +1.45, 11.7 mm at the right-foot take-off at
  -1.15, 5.5 mm on the back leg at +0.43. It lasts a few frames, under 2 px in
  the Swing camera. I did not change pose data (prototype wins; it is step 0
  material). The test now checks the authored point is exact, the solved ankle
  holds to 1 mm whenever the leg is in reach, and the settle stays under 16 mm.
  **Open** for the owner: fix it at the source (a slightly lower
  `pelvisHeight` at those moments, or shorter strides, see "Known weak spots"
  in POSES.md) when the swing is next edited.
- **Test 5 (racquet speed): measurement chosen.** The spec does not say how to
  measure speed. Over +/-1 ms, speed at contact is 0.899 of the peak (fails by
  0.1 percent); across one 60 fps frame (h = 1/120 s) it is 0.906 with the
  peak at +0.010 s (passes). The test uses one frame, since that is what a
  viewer sees. The dip is in the data: `handR` has a zero tangent at contact.
- **Test 8 (recovery): which T stance.** The clip returns exactly to its own
  ready stance, pelvis at (3.20, 5.95). `court.ts` `T_STANCE` is (3.20, 5.89),
  6 cm further forward. The test checks the clip ends within 0.05 m of its
  start pose and within 0.1 m of `T_STANCE`. **Open** for step 3: pick one
  definition of the T stance (I would move `T_STANCE` to 5.95 to match the
  figure, or shift the clip's ready feet).
- **Test 1 (contact)** uses the good variant's strike point and the anchor
  (5.6, 8.4), since scenes carry no clip placements until step 3. Error
  0.0006 m. The "every placement in every scene" form comes with step 3.
- Limb joints keep the prototype's names (`hip/knee/ankle/heel/toe`,
  `shoulder/elbow/hand`) as `LegPose` and `ArmPose`, not `root/mid/end`.
- Only the figure, track and camera types were added to `types.ts`. `Player`,
  `Caption`, `Scene` and `Director` stay as they are until steps 3 and 4 use
  them, so the current SVG stage keeps compiling.
- `trajectory.ts` already exports an object `Vec3 {x, y, z}`; the new tuple
  `Vec3` in `types.ts` has the same name. They never meet in one file yet.
  Resolve in step 3 or 8.
- Vector helpers live in `src/anim/vec.ts` (not in ARCHITECTURE's file list).
  Limb radii live in `figure/body.ts` as `LIMB_RADII`; `BODY.butt` (0.07)
  replaces a literal in the solver.
- `placeFigure(mirror)` flips positions and directions but does not swap left
  and right limb names, as in the prototype. ARCHITECTURE's `ClipPlacement`
  comment says it swaps limbs. Settle in step 8 when left-handers are tested.
- Canvas renderer, step 1 scope: floor, board hints, floor line bands, floor
  outline, figure shadows, figure, skeleton overlay, ball as a dot at the
  contact point. `FrameState.scene` is optional and a `skeleton` flag was
  added. Walls, zones, ball, marks and highlights are step 2.
- `#/dev/swing` uses scene time with contact at 2.00 s, the same as the
  prototype after its lead-in, so the same `t` shows the same frame in both.
  Playback is constant rate (the pace track is step 4). Beyond the plan's
  list it has a time readout, a half-speed button and a light/dark button.
  Hooks: `?t=2.0`, `?theme=dark`, `?skeleton=1`, `window.__seek(t)`. The hash
  router now ignores a `?query` after the route (`hashQuery()` reads it).
- Tokens added to `styles.css` exactly as DIRECTION.md lists them.

Verified, and how:

- `npm test` (43 tests, 21 new) and `npm run build` pass.
- Chromium at 390 px, light and dark: the canvas is 332 x 371 CSS px on both
  pages. Canvas bitmaps compared at t 1.20, 2.00 and 2.40: every figure pixel
  is identical; the only differing pixels are step 2 elements (walls, target
  zone, ball and its path, contact highlight). No console errors, no
  horizontal scroll, theme switch recolours the canvas, scrubber seeks,
  reduced motion holds the contact pose without autoplay.
- Not verified: frame rate on a real phone (step 6).
