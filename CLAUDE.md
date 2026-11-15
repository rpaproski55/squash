# Squash app

A guidance-first progress app for squash players. Read `docs/PRODUCT_BRIEF.md`
before building anything: it holds the product decisions and the build order.

## State of the repo

- `index.html` is the original single-file reference page (level cards 2.0 to
  6.0, tap-to-rate fundamentals, court diagram). It is the source for level
  content and is to be replaced by the app, not extended.
- Its known scroll bug is probably the `scrollIntoView` call inside the
  `IntersectionObserver` near the end of the file, which fights the user's page
  scroll. Not worth fixing separately; the rebuild removes it.

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
- SVG for court animations, driven by a small declarative format (a shot is
  data: path, bounce points, player positions, timing) so the renderer can be
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
