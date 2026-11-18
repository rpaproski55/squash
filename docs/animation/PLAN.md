# Build plan

Read `DIRECTION.md`, `ARCHITECTURE.md`, `POSES.md` first, and open
`prototypes/straight-drive.html` in a browser (it works from the file system,
offline). The prototype is the specification for motion and framing. Port it;
do not reinterpret it. Its `core` script block is the code to move into
`src/anim/`.

Every step: `npm test` and `npm run build` pass, and the result is checked at
390 px wide in a real browser, light and dark. Useful prototype hooks to copy
into a dev page: `?t=2.0` freezes on a scene time, `?theme=dark`, the skeleton
overlay.

## Step 0. Owner looks at the prototype (no code)

Open the prototype on a phone. The owner approves the swing or lists changes.
Changes at this point are edits to numbers in `POSES.md` and the prototype.
Done when: the owner has said yes to the figure and the Auto sequence.

## Step 1. Port the figure and show the swing

- Add `src/anim/tracks.ts`, `figure/body.ts`, `figure/solve.ts`,
  `figure/clips/forehandDrive.ts`, `camera.ts` from the prototype core, typed
  as in `ARCHITECTURE.md`.
- Add `src/anim/figure.test.ts` with tests 1 to 9 from `ARCHITECTURE.md`.
- Add a canvas renderer that draws floor, lines and the figure only, and a dev
  route `#/dev/swing` with play, scrubber, the `quarterClose` camera and the
  skeleton toggle. No ball yet beyond a dot at the contact point.
- Add the new tokens to `src/styles.css`.

Done when: tests pass; solved joints match the table in `POSES.md` to 0.01 m;
side by side with the prototype at the same time the figure is
indistinguishable. **Stop and show the owner.**

## Step 2. Court, ball and marks on canvas, all cameras

- Complete `CanvasStageRenderer`: walls with the inside-only rule, line bands,
  tin, zones, ball with trail, floor and wall shadows, dotted path, marks,
  depth ordering of ball against figure.
- All four cameras selectable on the dev route.

Done when: every existing scene variant plays in every camera with no
horizontal mirroring (test 9), the ball never draws outside the court, and
both themes match the reference stills in `prototypes/frames/`.

## Step 3. Scenes drive the figure

- Shift the straight drive scenes by 0.8 s; replace the `you` keys with a
  `motion` placement; add `figureAt(player, t)`.
- Move captions to the times and marks in `DIRECTION.md`.
- Update `scenes.test.ts`; add tests 10 and 12.

Done when: all four variants show the figure striking the ball at the scene's
strike time, and the old tests still pass.

## Step 4. Director, pace and the real stage

- Add `director.ts` with `DEFAULT_DIRECTOR`, `directedCamera`, pace.
- Rebuild `CourtStage.tsx` as the shell: canvas, Auto / Swing / Behind / Above
  control, caption strip under the stage, play, scrubber, half speed, variant
  chips, loop fade. No per-frame React state.
- Reduced motion behaviour from `DIRECTION.md`.

Done when: on the skill page at 390 px the Auto loop matches the prototype
(8.0 s per loop, near-freeze at contact, camera arrives behind before the wall
hit); switching variant or camera never changes the stage size; with reduced
motion on, nothing moves until play is pressed; test 11 passes.

## Step 5. Teaching highlights and cue linking

- Racquet ring, foot arrow, contact line, zone pulses.
- The skill page's cue list highlights the cue of the current caption, as it
  does today.

Done when: each row of the teaching table in `DIRECTION.md` can be seen by
scrubbing to its time.

## Step 6. Today card, drill, phone check

- Compact stage on the Today card: Auto sequence, no controls, plays once when
  scrolled into view, then holds the last frame.
- Drill scene: one placement per swing with `from` and `to`, blended between
  swings; the `behind` camera only, counter drawn in the DOM over the stage.
- Run on a real mid-range phone. Record the frame rate in `DECISIONS.md`.

Done when: 60 fps on the phone through the camera move (or the cause and fix
are written down), and the drill shows five clean swings with no pop between
them.

## Step 7. Misses that show the fault (after the owner has seen step 4)

Each miss gets a pose override on the base clip so the body shows the cause:

| Variant | Override | Caption may then say |
|---|---|---|
| Too short | String normal at contact tilted up 3 degrees instead of 14; contact 5 cm lower | Face too closed, ball stays low |
| Off the wall | Chest yaw at contact 45 instead of 75; contact 0.25 m ahead of the front foot | Chest opened early, hit in front |
| Too hard | Follow-through 30 percent longer; face 22 degrees open | Swung up and through it |

Format: `ClipPlacement.overrides?: Partial<FigureTracks>` whose keys replace
keys at matching times. Until this step is done, miss captions describe only
the ball.

Done when: with captions hidden, the owner can tell the good swing from each
miss in the Swing view.

## Step 8. Clean up

- Delete the old SVG top and side views and `swingAt`.
- Update `CLAUDE.md` (animation section) and add a short README to
  `src/anim/`.
- Left-handed: add `mirrorScene`, one test that the mirrored figure still
  meets the ball, and leave the setting out of the interface until asked.

## Not in this plan

Backhand clip, open-stance clip, volleys, a second player, sound. The format
covers them; each is new clip data plus a scene.
