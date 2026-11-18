# Creative direction

Owner decisions this is built on (see `DECISIONS.md`): soft mannequin figure,
a directed sequence as the default view, classic footwork now with room for an
open stance later, right-handed built now with the format ready for left.

Everything here is running in `prototypes/straight-drive.html`. Where prose
and prototype disagree, the prototype wins. Reference stills:
`prototypes/frames/auto-light.png` and `auto-dark.png`.

## The idea in one line

A small 3D world drawn flat. The court, ball and a jointed mannequin live in
real court metres; every view is a camera pointed at that one world. It is
like filming one rally with three cameras instead of drawing three diagrams,
so the views can never disagree with each other.

## Views

One stage, 358 x 400 CSS px at a 390 px phone (aspect 0.895), same size in
every view so nothing jumps. A segmented control top-left of the stage:

| Control | What it does |
|---|---|
| **Auto** (default) | The directed sequence below. One tap-free watch teaches the whole shot. |
| **Swing** | Rear-quarter close-up of the body. Pushes in for the swing, eases back out for the recovery. |
| **Behind** | Fixed camera behind the back wall. Height on the front wall and tightness to the side wall in one picture. |
| **Above** | The top view, kept for court position and the path back to the T. |

Cameras are pinhole cameras: position, look-at point, horizontal field of
view, in court metres (x across, y from the front wall, z up).

| Camera | Position | Looks at | FOV | Framing |
|---|---|---|---|---|
| `quarterWide` | 12.7, 14.5, 2.3 | 4.3, 7.4, 0.85 | 27 | T to back corner, figure about 95 px tall |
| `quarterClose` | 11.8, 14.1, 1.9 | 4.9, 8.3, 0.92 | 20 | 112 px per metre at the figure, about 195 px tall |
| `behind` | 4.6, 17.0, 3.9 | 5.0, 0, -0.4 | 30 | Right two thirds of the court; figure 74 px per metre; wall target 43 x 17 px |
| `top` | 3.2, 4.55, 30 | 3.2, 4.55, 0 | 18.5 | Whole court, front wall at the top (camera up vector is -y) |

Why rear-quarter and not a true side view: the handoff proposed looking in
through the side wall. I built it and rejected it. For a forehand the player
faces that wall, so the lunge comes straight at the camera and the racquet
points at the lens at contact, the one moment that matters. From the back
right corner (40 degrees round from the side) the hitting arm is nearest the
camera and never hidden, the lunge reads across the picture, and the move to
the behind camera is a short 50 degree swing rather than a cut.

Walls are drawn only when the camera is on their inside. A wall the camera
looks through is dropped (its out line stays, faint).

## The directed sequence

Times are scene seconds relative to the strike (tau). Scenes are slow motion
already; the pace track slows them further near contact.

| tau | Camera | What the viewer sees |
|---|---|---|
| -2.00 to -1.55 | `quarterWide`, still | Ready on the T, split step, ball comes off the front wall |
| -1.55 to -0.62 | push in to `quarterClose` | Turn, racquet goes up, three steps toward the corner |
| -0.62 to +0.10 | `quarterClose`, still | Lunge, swing, contact, first part of the follow-through |
| +0.10 to +0.52 | swing round to `behind` | Follow-through finishes while the camera travels; arrives just before the ball reaches the front wall (+0.55) |
| +0.52 to end | `behind`, still | Wall hit, flight down the wall, first bounce, dies in the corner, player back on the T |

Camera moves ease in and out (cubic). During a move the look-at point trails
the position (blend k squared) so the figure stays in frame. No camera shake,
no zoom on impact, no move that is not listed here.

Pace (playback rate against scene time, linear between keys):

| tau | -2.00 | -0.95 | -0.45 | -0.12 | -0.025 | +0.03 | +0.10 | +0.50 | +0.85 |
|---|---|---|---|---|---|---|---|---|---|
| rate | 0.95 | 0.95 | 0.50 | 0.32 | 0.07 | 0.07 | 0.34 | 0.70 | 1.00 |

The dip to 0.07 is a near-freeze on contact of about 0.6 s on screen. One loop
is 8.0 s of viewing for 5.2 s of scene time, then a 0.25 s fade through the
stage colour and restart. The half-speed button multiplies the pace. In the
Above view the pace is floored at 0.6 (a slow-motion dot teaches nothing).

## The figure

A soft mannequin: tapered capsules for limbs, a capsule torso with a shoulder
bar and hip bar, a round head, no face, no clothes. Like an artist's wooden
mannequin: enough body to show joints truthfully, not enough to be wrong.

- Height 1.74 m. Segment lengths and radii are in `POSES.md`.
- Body `--figure`. Limbs on the far side of the torso use `--figure-far`.
  The hitting arm and hand use `--accent`. This is the only accent on the
  figure, so the eye follows the swing.
- Every part gets a 2.5 px outline in `--figure-edge` drawn under its fill, so
  overlapping limbs stay separate at any angle. Parts are painted far to near.
- Racquet: `--racquet` frame and shaft, strings a 22 percent `--accent` wash.
  The head is a true 3D ellipse (0.23 x 0.18 m) so the open face at contact is
  visible, not implied.
- Shadows: a soft blob under the pelvis and one under each foot that fades as
  the foot lifts. They are what sells foot plants.
- In the Above view the same figure is drawn (about 30 px across). It reads as
  a small body with a racquet, which is enough for position.

## Court, ball, zones, markers

- Floor `--floor` with faint board lines running front to back; front wall
  `--wall`; side and back walls `--wall-side` (new, slightly darker than the
  front wall so the corner reads). Court lines are real 5 cm bands in
  `--court-line`, drawn in perspective. The tin is a filled band.
- Ball `--ball` with `--ball-edge`, drawn at 0.05 m radius (real is 0.02) with
  a floor of 3.4 px. A 10-step comet trail 0.18 s long.
- After the strike the ball leaves a dotted path in the variant's colour
  (`--good` or `--bad`), so the shape of the shot stays on screen.
- Floor shadow under the ball always. **Wall shadow**: when the ball is within
  1.2 m of the side wall a second shadow is drawn on that wall. The gap between
  ball and wall shadow is the tightness, visible without any label.
- Zones: `--target` fill, `--target-edge` stroke. The wall target pulses while
  the "aim" caption shows (tau 0.05 to 0.7); the floor target while the ball is
  coming back (0.6 to 1.6).
- Marks: at a marked wall hit or bounce, a ring expands (0.5 s) and a 9 px
  check or cross badge pops in (0.18 s, 35 percent overshoot). Good is
  `--good`, bad is `--bad`.

## Teaching moments

Each coaching cue lands as a caption plus one thing on the court.

| Cue | tau | Caption | On court |
|---|---|---|---|
| (setup) | -2.00 | Watch the ball, racquet ready | Ready stance, ball leaves the front wall |
| 1 Racquet up early | -1.45 | Racquet up early | Dashed accent ring around the racquet head while the feet are still moving |
| 2 Side-on, front foot | -0.62 | Side-on, front foot to the wall | Accent arrow on the floor from the front toe toward the side wall |
| 2 (contact) | -0.03 | Contact level with the front foot | Near-freeze; dashed line across the floor through front foot and ball, dropline from the ball |
| 3 Aim above the service line | +0.12 | Aim just above the service line | Camera arrives behind; wall target pulses; good mark on the wall |
| 5 Back to the T | +0.62 | Straight back to the T | Figure recovers in shot with racquet up while the ball is still travelling |
| 4 Behind the box, dies | +1.35 | Lands behind the box, dies in the corner | Floor target pulses; good mark; ball dies against the back wall |

Captions sit in their own strip under the stage, never over the court (the old
overlay hid the feet). They cross-fade in 140 ms.

Misses: same swing, same cameras. The reveal is the ball: red dotted path, red
cross where it lands. Until a miss has its own body fault animated (see
`PLAN.md` step 7) its captions describe only the ball. Do not caption a body
fault the figure is not showing.

## Motion principles

1. Feet plant and stay planted. No sliding, ever.
2. The racquet is fastest at the ball. Head speed climbs to contact and falls
   after it (measured in `POSES.md`).
3. Order of movement is feet, hips, shoulders, arm, racquet. The hips lead
   the chest by about 15 degrees through the downswing.
4. Slow down for what teaches, run at speed for what connects.
5. One camera idea per shot: body close, then ball from behind.
6. Interface motion (chips, caption) stays under 200 ms and never competes
   with the court.

## Reduced motion

No autoplay and no camera moves. Show the contact pose from `quarterClose`
with the contact highlight and its caption. Play still works if the viewer
presses it; the scrubber always works. Camera changes become cuts, the loop
fade is removed, marks appear without the ring or the pop.

## Tokens

Existing tokens are kept. Proposed additions:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--figure` | `#2f3a36` | `#e9e3d8` | Body |
| `--figure-far` | `#66716c` | `#a39c90` | Limbs behind the torso |
| `--figure-edge` | `#fffdf9` | `#1f2220` | Outline between parts |
| `--racquet` | `#1d2320` | `#eef1ee` | Frame and shaft |
| `--wall-side` | `#f6f0e6` | `#252927` | Side and back walls |
| `--stage` | `#efe8dd` | `#171a18` | Behind the court |
| `--shadow` | `rgba(60,40,10,.20)` | `rgba(0,0,0,.40)` | Ball and figure shadows |

## What "amazing" means at 390 px

- A player who has never seen the app can say, after one loop with the sound
  off and no reading, where the feet go, when the racquet goes up, and where
  the ball should hit the wall and land.
- Paused on any frame, the figure is a pose a coach would accept.
- 60 fps on a mid-range phone, no dropped frames during the camera move.
- Light and dark both look intended.

Avoid: motion blur, squash and stretch on the body, bouncy easing on limbs,
camera shake, speed lines, any exaggeration of the swing. They look good and
teach a swing nobody should copy.

## Technique check

The handoff asked me to verify the mechanics. What the figure shows and where
I disagree with or add to the lesson text:

- **Front foot at the wall.** Shown at 85 degrees (5 degrees toward the front
  corner). A foot dead square to the wall locks the hips; nobody stands that
  way. The cue text is fine as a cue.
- **Contact level with the front foot.** Correct for a straight drive and now
  drawn explicitly. Worth adding to the lesson text: contact behind the foot
  drags the ball into the side wall, contact ahead of it sends it crosscourt.
- **Wrist cocked, about a right angle.** Shown at 110 degrees at the top of the
  backswing and 119 at contact. A literal 90 at contact would put the racquet
  head above the hand on a ball at knee height, which is not how a low drive
  is hit. "Wrist firm and cocked, head above the wrist until the swing starts"
  is the accurate version.
- **Follow-through finishes high.** Shown finishing at head height in front of
  the leading shoulder, compact. The text should say high and short: a
  wrap-around finish is dangerous with an opponent behind and is a stroke
  against you.
- **Missing from the cues, shown by the figure:** the split step on the T as
  the opponent hits; the open racquet face at contact (strings tilted up about
  14 degrees), which is what gives the height above the service line; hips
  turning before the shoulders.
- **Open stance.** Many players hit this ball off the right foot. Not shown,
  by owner decision; the format carries it as a second clip.
- **The feed is fast.** The existing scene gives the ball 0.48 real seconds
  from front wall to racquet. It reads fine in slow motion but the figure
  needed 0.8 s more lead time (see `ARCHITECTURE.md`).
