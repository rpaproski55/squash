# Animation handoff: creative direction and architecture

This folder is the shared context for reworking the court animations. It is
written to be picked up cold by a new session.

- **Planning session (Fable):** reads this file, studies the code, and writes
  the direction, architecture and plan into this folder. It does not change
  the app code.
- **Build session (Opus or another model):** reads this file plus the
  planning output and implements it.

## How to use this folder

| File | Written by | What it holds |
|---|---|---|
| `HANDOFF.md` | previous build session | This brief. Do not edit; add notes to `DECISIONS.md`. |
| `current/*.png` | previous build session | Screenshots of today's animation at phone width (390px). |
| `DIRECTION.md` | planning session | Creative direction: visual language, cameras, figure, motion principles. |
| `ARCHITECTURE.md` | planning session | Changes to the scene format and renderers, with TypeScript types. |
| `POSES.md` | planning session | The figure's keyframes for the straight drive, as numbers. |
| `PLAN.md` | planning session | Ordered build steps, each with acceptance criteria. |
| `prototypes/` | planning session | Optional self-contained HTML prototypes of the motion. |
| `DECISIONS.md` | either | Running log of decisions, open questions and owner answers. |

Work on top of branch `claude/stoic-ramanujan-0f1qv5` (pull it first). Commit
the planning output to `docs/animation/` on the session's own branch and push,
so the build session can fetch it.

## Why this work is happening

The owner looked at the step 2 preview (the straight drive, end to end) and
made animation quality the top priority before building anything else.

The owner's words, summarised:

- The top-down view "doesn't work as a player". It reads like a diagram, not
  like playing squash.
- A side view with a side-on figure would help a player understand the shot.
- The goal is visuals that are as good as possible: smooth, polished motion
  that a player enjoys watching and can learn from on court.
- The existing top view can stay as a secondary angle since it is built.

The product brief (`docs/PRODUCT_BRIEF.md`, section 4) already says visuals
are a headline feature, and asks for an animation system a richer renderer can
replace later (real video, then a 3D player) without rewriting content.

## The product, in short

Read `docs/PRODUCT_BRIEF.md` and `CLAUDE.md` in full. The points that matter
for the animation:

- A guidance-first progress app for club squash players. A player opens it
  right before or after playing, on a phone, often with poor signal.
- Every skill and drill gets an animated court visual in one consistent style.
- **Coded animations only** in v1. No AI-generated clips or video: a clip that
  looks right but shows a wrong wrist teaches a bad habit. Accuracy beats
  flash.
- Phone-first (design at 390px wide), offline PWA, light and dark themes,
  respect `prefers-reduced-motion`.
- Look: playful and clean. Airbnb warmth, Notion organisation, motion quality
  like the Muse app. Motion should explain something or reward an action.
- Nothing hardcoded to one player. Handedness is not handled yet (all scenes
  are right-handed); say whether the format should support left-handers now.

## What exists today

Stack: Vite, React 19, TypeScript, Motion (`motion/react`), Dexie, Vitest.
Run `npm install`, `npm run dev`, `npm test`.

### The scene format (`src/anim/types.ts`)

A scene is pure data on a timeline. Court space is in metres, right-handed
player facing the front wall:

- `x` across the court: 0 = left wall, 6.4 = right wall
- `y` depth: 0 = front wall, 9.75 = back wall
- `z` height above the floor

A `Scene` has:

- `ball`: waypoints `{t, x, y, z, event?, mark?}`. Events are `feed`,
  `strike`, `front`, `bounce`, `back`, `roll`. Between waypoints the ball
  follows a ballistic arc under the scene's `gravity` (x and y linear), except
  `roll` segments which run along the floor. `mark: 'good' | 'bad'` points get
  a check or cross marker when reached.
- `players`: keyframes `{t, x, y, swing?}`. Today a player is a dot with a
  racquet line that sweeps around the swing keyframe. **There is no body,
  pose or joint data.** This is the main gap.
- `zones`: target areas on the floor or the front wall.
- `captions`: timed text, optionally linked to a coaching cue so the skill
  page can highlight that cue while it plays.
- `counter`: optional on-court counter, used by the drill.
- `duration` and `gravity`. Scenes run about 2.5 times slower than real play,
  so gravity is 3 rather than 9.8.

A `SceneSet` groups variants: the good version first, then the misses.

Court geometry is in `src/anim/court.ts` (World Squash singles dimensions,
the T, the back of the service box, a racquet length of 0.7 m).

### The maths (`src/anim/trajectory.ts`)

`ballAt`, `samplePath`, `playerAt` (eased), `swingAt`, `captionAt`,
`counterAt`. All pure functions.

### The scenes (`src/anim/scenes/straightDrive.ts`)

- `straight-drive`: four variants of a forehand straight drive from the back
  right corner. `good` (lands behind the service box, dies in the corner),
  `short`, `loose` (off the wall), `long` (too hard off the back wall).
- `drive-streak`: the solo drill. Five good drives with a counter, then a
  short one that resets it to zero.

`src/anim/scenes.test.ts` checks the scenes are physically plausible (inside
the court, above the tin) and teach the right thing (the good drive lands in
the target, each miss misses). Keep tests like these for any new view.

### The renderer (`src/ui/CourtStage.tsx`)

One React component, SVG, re-rendered each animation frame from a
`requestAnimationFrame` clock (fine for this element count). It has:

- **Top view:** court from above, front wall at the top. The ball is lifted
  off its shadow to suggest height. See `current/light-skill-top.png`.
- **Side view:** looking through the right side wall, front wall on the
  left. The players are a plain capsule. It is only about 160px tall at
  390px width, which makes it cramped. See `current/light-skill-side.png`.
- Controls: play or pause, scrubber, half speed, and an Above or Side switch.
  Variant chips (Good length, Too short, Off the wall, Too hard). A caption
  line under the court. Under reduced motion it shows the final frame and
  does not autoplay.
- Used on the Today card (compact, no controls), the skill page (full), and
  for the drill.

Theme colours are CSS tokens in `src/styles.css`: court green, ball yellow,
a warm coral accent, warm floor, red court lines, good and bad colours, each
with light and dark values.

### What the straight drive must show correctly

From the lesson content (`src/content/skills.ts`), these are the coaching
cues the animation is meant to teach, in order:

1. Racquet up early: up and back while moving to the ball.
2. Side-on, front foot pointing at the side wall, staying low.
3. Aim about a foot to a foot and a half above the service line, close to the
   side wall.
4. First bounce behind the service box, then the ball dies in the back corner.
5. Straight back to the T, racquet up, before the opponent hits.

Body mechanics from the level content: handshake grip; wrist cocked so
racquet and forearm make roughly a right angle with the racquet head up;
contact roughly level with the front foot; a lunge rather than hitting
upright; a firm wrist and a full swing rather than a slap; a follow-through
that finishes high. Verify these against your own knowledge of squash
technique and flag anything you think is wrong or missing. The owner would
rather be told than shown something inaccurate.

## What the previous session recommends

These are proposals for you to accept, change or reject, with reasons.

1. **A new main camera from behind the player**, looking at the front wall,
   slightly raised. It is how a player sees the court, and it shows the two
   things that make a straight drive good in one picture: height on the front
   wall and tightness to the side wall. The top view cannot show height well
   and the side view cannot show tightness at all.
2. **The side view becomes the body view.** Larger on screen, with a jointed
   side-on figure showing the step in, lunge, swing and recovery.
3. **Keep the top view** as a third angle for court position and the
   recovery to the T.
4. **A simple, anatomically sensible figure** first: a clean silhouette with
   joints (shoulder, elbow, wrist, hip, knee, ankle) and a racquet, posed by
   keyframes. Get the timing right before adding detail.
5. **Keep everything as data.** The shot data is already 3D, so new cameras
   are projections of the same scenes. Poses should be data too, so a 3D
   renderer can reuse them later.

## What the planning session should produce

Answer these, concretely enough that a build session can implement without
guessing. Numbers beat adjectives.

### 1. Creative direction (`DIRECTION.md`)

- The visual language: how the court, ball, figure, trails, zones and
  markers look in each camera, in both themes, within the existing tokens
  (propose token changes if needed).
- Which cameras exist, which is the default, and the exact framing of each
  (camera position, field of view or projection, what is cropped).
- The figure: style, proportions, level of detail, how the racquet reads,
  how it looks in each camera (or whether some cameras show no figure).
- Motion principles: timing, easing, anticipation and follow-through, how
  slow-motion near contact works, camera movement if any, transitions
  between variants and between cameras.
- How the teaching moments land: captions, highlights, markers, the "good"
  and "bad" reveals. Each cue above should map to a visible moment.
- Reduced-motion behaviour.
- What "amazing" means here, judged on a 390px phone screen, and what to
  avoid (anything that looks impressive but teaches the wrong thing).

### 2. Architecture (`ARCHITECTURE.md`)

- Additions to `src/anim/types.ts`, written as TypeScript: figure pose data
  (joint angles or positions, per keyframe, how it is interpolated), camera
  definitions, anything for slow motion or camera moves.
- How each camera projects 3D court space to the screen. A perspective view
  needs real projection maths; say where it lives.
- Renderer choice: stay with SVG and React re-renders, move the per-frame work
  to direct DOM updates, or use canvas. Justify it for phone performance and
  for swapping in a 3D renderer later.
- How handedness and backhand drives fit the format, even if not built now.
- What tests should check (for example, the racquet meets the ball at the
  strike time in every camera).

### 3. Pose library (`POSES.md`)

Keyframes for the right-handed forehand straight drive from the back right
corner, matched to the `good` variant's timing (strike at t = 1.2 s): ready on
the T, move, racquet up, step in, lunge and contact, follow-through, recovery.
Give the actual numbers in the format from the architecture.

### 4. Build plan (`PLAN.md`)

Ordered steps, each small enough for one sitting, each with acceptance
criteria and how to check it at phone width. The first step should produce
something the owner can look at and judge the figure's swing early, before
everything else is built on it.

### 5. Prototype (optional, recommended)

A self-contained HTML file in `prototypes/` that plays the figure's swing and
the behind-the-player camera, so the build session copies proven motion
rather than reinterpreting prose. No external requests, so it opens offline.

## Limits for the planning session

- Do not change files under `src/`. Write only in `docs/animation/`.
- Do not add dependencies to `package.json`. If the plan needs one, name it
  and justify it in `ARCHITECTURE.md`.
- Keep the content (skills, drills, levels) as it is. Only the animation
  system is in scope.
- Record anything you could not decide, and why, in `DECISIONS.md` as an
  open question for the owner.

## Kickoff prompt for the planning session

Paste this into the new session:

> Read `docs/animation/HANDOFF.md` on branch `claude/stoic-ramanujan-0f1qv5`
> and follow it. You are the planning session: own the creative direction,
> architecture and build plan for the court animations, and write them into
> `docs/animation/`. Do not change app code. Ask me clarifying questions
> before you start writing, then commit and push your output.

## Kickoff prompt for the build session

After the planning output is pushed, paste this into the build session:

> Fetch the branch with the animation planning output and read everything in
> `docs/animation/`, starting with `HANDOFF.md`, then `DIRECTION.md`,
> `ARCHITECTURE.md`, `POSES.md` and `PLAN.md`. Implement `PLAN.md` step by
> step. Stop after the first step and show me the figure's swing before
> continuing.
