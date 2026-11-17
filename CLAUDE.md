# Squash app

A guidance-first progress app for squash players. Read `docs/PRODUCT_BRIEF.md`
before building anything: it holds the product decisions and the build order.

## State of the repo

Build steps 1 and 2 are done (scaffold, content as data, straight drive end
to end). The animation rework that the owner asked for before step 3 is done:
`docs/animation/PLAN.md` steps 1 to 8, logged in `docs/animation/DECISIONS.md`.
Read `src/anim/README.md` before touching `src/anim/` or
`src/ui/CourtStage.tsx`.

Build step 3 (core loop) is done: the home focus list (`src/data/focus.ts`,
rules from the brief's section 10) and session logging for drills and
matches. Build step 4 (progress: trends, level-change suggestion) is next.
Choices are logged in `docs/core-loop/DECISIONS.md`.

- `npm run dev` / `npm run build` / `npm test`. Vite + React + TypeScript,
  `vite-plugin-pwa`, Dexie, Motion, Vitest. Hash routing, relative base, so
  `dist/` works on any static host (GitHub Pages included).
- `src/content/`: levels, foundations, skills and drills as typed data, in our
  own words with SquashClub.org links. Drill targets are first-draft
  assumptions.
- `src/anim/`: the declarative shot format. A scene is 3D ball waypoints
  (x across, y from the front wall, z height), a player with a pose clip
  placed at the strike, zones and captions. A jointed mannequin is solved from
  clip tracks with IK; four pinhole cameras (Auto sequence, Swing, Behind,
  Above) project the same 3D world; `render/canvas.ts` draws it and
  `ui/CourtStage.tsx` is the shell. A new renderer reads the same `FigurePose`
  and scenes. See `src/anim/README.md`.
- `src/anim/figure.test.ts` and `scenes.test.ts` check the figure (contact,
  reach, planted feet, racquet speed, framing, the misses' faults) and that the
  scenes teach the right thing (the good drive lands in the target, the misses
  do not).
- `src/data/`: Dexie database and `drillStats.ts` (typical = median of the
  last 5 sessions, level met, next target, trend), with tests.
- `docs/reference-ladder.html` is the original single-file page, kept as a
  reference only.

## Rules that come from the owner

- Guidance beats tracking. The home screen answers "what do I work on today?"
- Logging a session takes 60 seconds at most.
- Progress is based on drill scores and match results, not self-rating alone.
- Visuals are a headline feature. v1 uses coded animations only: no AI
  generated clips, no video yet.
- Nothing hardcoded to one player or level. Level selection is optional.
- Phone-first PWA, offline, data on the device, no login.
- Look: playful and clean. Airbnb warmth, Notion organisation, smooth
  purposeful motion. Light and dark. Respect `prefers-reduced-motion`.
- Rewrite lesson text in original words; keep SquashClub.org attribution.

## Recommended stack

Not yet confirmed by the owner; change it if there is a good reason.

- Vite, React, TypeScript
- `vite-plugin-pwa` for install and offline
- IndexedDB through Dexie for local data
- Canvas 2D for court animations, driven by a small declarative format (a shot
  is data: ball path, a pose clip, cameras, timing) so the renderer can be
  swapped later
- Motion for interface animation
- Vitest for logic such as readiness and focus selection

## Working agreement

- Build step 2 of the brief (the straight drive, end to end) and show it to
  the owner before scaling to other skills.
- Check the interface at phone width in a real browser before calling a screen
  done.
- The owner likes clarifying questions first, concise answers, analogies for
  new concepts, and direct pushback.
