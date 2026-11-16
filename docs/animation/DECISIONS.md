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
