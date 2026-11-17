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

## Owner review of the prototype, 2026-11-17

- Owner: the prototype looks great. Step 0 of `PLAN.md` is approved as is:
  the swing, the Auto camera sequence and the mannequin's level of detail.
  The build session can start at Step 1 with no pose changes.

## Build session, Step 1, 2026-11-17

- Ported the prototype core to `src/anim/` (`vec.ts`, `tracks.ts`,
  `camera.ts`, `figure/body.ts`, `figure/solve.ts`, `figure/clips/`) and the
  court and figure parts of its renderer to `render/canvas.ts`. Logic is line
  for line; only types and formatting changed.
- Limbs keep the prototype's joint names (`hip/knee/ankle`,
  `shoulder/elbow/hand`); ARCHITECTURE allowed either.
- The old ball position type in `trajectory.ts` is renamed `BallPos`, so
  `Vec3` can be the `[x, y, z]` tuple the new format uses.
- Test 4 (planted feet) is relaxed. ARCHITECTURE asked for under 1 mm, but on
  the approved data the solved ankle sits up to 1.6 cm short of the planted
  foot point where a long stride lands at full reach (stretch up to 1.035,
  which test 3 allows; the IK clamp pulls the ankle in). The test now checks
  the authored foot point holds exactly and the ankle stays within 2 cm. Under
  2 px in the closest camera. Fixing it means shorter strides, a pose change,
  so it is left for the owner.
- Test 8 (recovery) checks the pelvis returns to the clip's own ready stance
  (3.20, 5.95). That is 0.06 m from `T_STANCE` in `court.ts` (5.89), so the
  0.05 m check against `T_STANCE` fails on the approved data. Prototype wins.
- Step 1 draws the full court (walls included), not only floor and lines, so
  the comparison with the prototype is like for like.
- Verified: solved joints match the POSES table to 0.015 m and 1.5 degrees.
  The canvas bitmap of `#/dev/swing` against the prototype at 340 x 380, ten
  times, light and dark: figure, racquet, shadows and court pixel-identical;
  the only differing pixels are the floor target, contact guide and ball
  trail, which arrive in Steps 2 and 5. Sheets in `build/step1-*.png`. 61 fps
  in headless Chromium, no horizontal scroll at 390 px.

## Build session, Steps 2 and 3, 2026-11-17

- Steps 2 and 3 checked together against the prototype, because the
  prototype's scenes already carry the 0.8 s lead-in: canvas bitmaps of all
  4 variants x 4 cameras x 6 times x 2 themes (192 frames). 173 are
  pixel-identical. The other 19 differ only in the racquet ring and contact
  line, which are Step 5 highlights (the prototype draws them already).
- `Scene` gains `tone` (colour of the dotted path) and `director`;
  `Caption` gains `mark`; `Player.keys` is optional and `Player.motion` added.
  The drill keeps its `keys` until Step 6.
- `figureAt(player, t)` plays the nearest placement; blending between
  placements comes with the drill in Step 6.
- `director.ts` is added in Step 3, one step early, because test 10 needs
  the directed camera.
- Test 10 (framing) requires the ball in frame only from tau -0.5. In the
  approved framing the opponent's feed comes in from off the right edge of
  `quarterWide` and enters the picture at tau -0.55. Prototype wins.
- The old SVG stage stays on the skill page until Step 4; it now places
  "you" by the solved pelvis.

## Build session, Step 4, 2026-11-17

- `CourtStage.tsx` is now a shell around the canvas renderer: Auto / Swing /
  Behind / Above, caption strip under the stage, play, scrubber, half speed,
  variant chips, loop fade. Per frame it only draws; React state changes for
  the caption, play state, view and variant. The scrubber is moved by a ref.
- The first build's SVG stage is now `LegacyCourtStage.tsx` and is used only
  for scenes without a figure (the drill) until Step 6. Deleted in Step 8.
- Loop length: 7.98 s to the end of the scene ("8.0 s per loop" in
  DIRECTION.md), 8.48 s for the full cycle including the 0.5 s rest before the
  restart. Measured the same way on the prototype: identical.
- The stage fills the card edge to edge: 356 x 398 at 390 px (the card's 1 px
  border takes the 2 px off DIRECTION's 358 x 400). The stage is the same size
  in every view and variant (checked by clicking through all of them).
- Reduced motion, per DIRECTION.md where the prototype is silent: opens on the
  contact pose in the Swing view, nothing moves until play; then it plays once
  and stops on the last frame, with camera moves as cuts, no loop fade, and
  marks without the ring or pop.
- Verified on the built app at 390 px: canvas bitmaps of the skill page
  against the prototype, 4 variants x Auto and Swing x 9 times x 2 themes. 130
  of 144 are pixel-identical, including both camera moves. The rest are the
  Step 5 highlights and one first-frame capture race on the prototype side.
  Cue highlighting still follows the caption. No console errors, no
  horizontal scroll.

## Build session, Step 5, 2026-11-17

- Ported the prototype's teaching highlights: dashed ring round the racquet
  head ("Racquet up early"), floor arrow from the front toe ("Side-on, front
  foot to the wall"), contact line and drop line ("Contact level with the
  front foot"). Zone pulses and cue linking were already in from Steps 2 and 4.
- The contact line uses the scene's clip anchor instead of the prototype's
  global `ANCHOR` (same point, 5.6, 8.4).
- Under reduced motion the racquet ring does not breathe and highlights
  appear without the 0.08 s fade-in. The prototype is silent on this; it
  follows DIRECTION.md's reduced-motion rule for marks.
- Verified: skill page against the prototype, 4 variants x Auto and Swing x
  11 times (including each highlight) x 2 themes, 176 of 176 frames
  pixel-identical. Settling both pages before the first capture removed the
  first-frame race seen in Steps 2 to 4. Captions and marks tested in
  `scenes.test.ts`.

## Build session, Step 6, 2026-11-17

- Today card: Auto sequence, no controls, plays once when at least half of it
  is on screen, then holds the last frame (ball dead in the corner, both good
  marks, player back on the T). Under reduced motion it holds the contact
  frame.
- Drill: one placement per swing, `from -0.62 to 0.42`, behind camera only
  (the drill's SceneSet has a one-camera director and flat pace 1, so the view
  switcher is hidden), counter in the DOM over the stage. The drill now uses
  the canvas stage; nothing uses `LegacyCourtStage.tsx` any more (deleted in
  Step 8).
- **Blend between swings: changed from the plan.** ARCHITECTURE.md says to
  blend over 0.15 s. The gap between two drill swings is 0.66 s and the left
  foot has to go 1.35 m back to where the next swing starts, so a 0.15 s blend
  would hold the finish for half a second and then slide the foot 1.35 m in a
  few frames: the pop the plan wants to avoid, and a sliding foot. Instead
  the blend runs smoothstep across the whole gap, and a foot that changes
  place is lifted like a step (same lift formula as the clip's own steps).
  Tested: in the gaps no joint moves more than 6 cm per 10 ms, and the moving
  foot is off the floor mid-gap.
- To blend, the solver is split into `sampleChannels` and `solveChannels`
  (with `blendChannels` between). `solveFigure` is the two together; the POSES
  table test confirms nothing changed.
- The dotted ball path starts at the latest strike, so the drill's five shots
  do not pile up. Identical for the one-strike scenes.
- **Frame rate: not measured on a real phone.** This session has no phone.
  Proxy in headless Chromium at 390 px and device pixel ratio 3, through the
  whole Auto sequence: 60 fps with no long frames at normal speed; 60 fps with
  2 frames over 25 ms at a 4x CPU slowdown; 59 fps with 3 at 6x. One frame's
  solve and draw costs 0.17 ms (0.9 ms at 4x). **Open** for the owner: open
  the skill page on a mid-range phone and say whether the camera move stutters.

## Build session, Step 7 draft, 2026-11-17 (awaiting owner OK)

- Draft of the miss fault poses, committed for review only; Step 7 is not
  done. Format: `ClipPlacement.overrides` (keys replace the clip's keys at
  matching times). Data in `figure/clips/forehandFaults.ts`, contact keys
  solved with the POSES.md method. Stills: `build/step7-faults-*.png`.
- Off the wall: chest 45 at contact, contact 0.25 m ahead of the front foot,
  racquet turned 3 degrees to the middle (the ball's actual angle in the
  scene). Too hard: face 22 degrees open; follow-through 30 percent more
  racquet angle and hand travel, hand capped at 0.53 m from the shoulder.
  Too short: face 3 degrees open, contact 5 cm lower (hand at 1.03 stretch,
  within the 1.04 limit).
- **Open** for the owner: "Too short" cannot be told from the good swing at
  phone size. Options: keep it, add a racquet-face close-up, or add an
  upright body (less knee bend and lean) with the closed face (recommended).
- Miss captions still describe only the ball until the owner approves.
