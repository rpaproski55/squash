# src/anim: the animation system

Shots are data; renderers draw them. Design and reasoning live in
`docs/animation/` (DIRECTION, ARCHITECTURE, POSES, PLAN, DECISIONS). The
approved motion reference is `docs/animation/prototypes/straight-drive.html`.

Court space is metres: x across (0 left wall, 6.4 right wall), y from the front
wall (0) to the back wall (9.75), z up. It is left-handed: a camera's
screen-right is `cross(up, forward)`.

| File | What it holds |
|---|---|
| `types.ts` | The format: `Scene`, ball points, zones, captions, `FigureClip`, `ClipPlacement`, `FigurePose`, `Camera`, `Director` |
| `court.ts` | Court dimensions |
| `trajectory.ts` | Ball position at a time, path sampling, current caption and counter |
| `tracks.ts` | Track samplers: monotone cubic, arc (for directions), linear (pace) |
| `vec.ts` | Vector helpers |
| `figure/body.ts` | Mannequin dimensions and limb radii |
| `figure/clips/` | Pose clips (`forehandDrive.ts`) and the misses' fault overrides (`forehandFaults.ts`) |
| `figure/solve.ts` | Sample a clip's channels, blend two, solve the skeleton with two-bone IK, place it on court |
| `figure/figureAt.ts` | A player's solved figure at a scene time: overrides, windows, blending between drill swings |
| `camera.ts` | The four cameras, projection, camera blending |
| `director.ts` | The Auto sequence, Swing view, pace (slow motion) |
| `mirror.ts` | `mirrorScene` for a left-hander (not in the interface yet) |
| `render/` | `FrameState`, the canvas renderer, theme colours |
| `scenes/` | The straight drive (four versions) and the drive-streak drill |

`src/ui/CourtStage.tsx` is the shell: clock, controls, caption strip and the
canvas. `#/dev/swing` is a dev page for the figure (`?t=2.0`, `&cam=behind`,
`&v=short`, `&skel=1`, `&theme=dark`; `window.__seek(t, view)` for screenshots).

## Adding a shot

1. Author a clip in `figure/clips/` (POSES.md, "Authoring another clip"): feet
   first, then the contact key, solved so the racquet head sits on the ball.
2. Write the scene in `scenes/`: ball waypoints, zones, captions (times
   relative to the strike, with `mark` for on-court highlights), and a player
   with a `motion` placement at the strike.
3. Run the tests: `figure.test.ts` checks contact, reach, planted feet,
   racquet speed and framing for every placement in every scene;
   `scenes.test.ts` checks the ball teaches the right thing.
4. Look at it in every view at 390 px, light and dark.

Misses reuse the good clip with `overrides` (keys replaced at matching times).
Drills use one placement per strike with a `from`/`to` window; `figureAt`
blends between them.
