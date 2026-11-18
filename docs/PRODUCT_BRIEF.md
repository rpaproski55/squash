# Squash app: product brief

This brief records the decisions from the discovery conversation with the owner.
It is the source of truth for the build. Where it says "assumption", the owner
has not confirmed the point and it can change.

## 1. The problem

A club player cannot tell whether they are improving, and does not know what to
work on next to keep moving up through the levels. Club ratings exist but are
not always an accurate picture of how someone plays.

## 2. Who it is for

The owner first: a club player rated around 3.5 (C). Other squash players
second, if the app proves useful. So:

- Nothing is hardcoded to one person or one level.
- No accounts, onboarding funnels or sharing features in v1.
- Whether this becomes a product is undecided. The bar for v1 is that it is
  useful and delightful to use.

## 3. What the product is

A guidance-first progress system. The existing `index.html` is a reference
poster, read once. The app must be something a player opens around every
session.

When guidance and tracking compete for space or effort, guidance wins. The home
screen answers "what should I work on today?"

### Core loop

1. **Before play, about 30 seconds.** The app shows one to three focus items for
   the player's level, each with a visual and, for solo sessions, a drill.
2. **After play, 60 seconds at most.** The player logs the session. If logging
   takes longer than a minute, the owner will stop using it. Treat this as a
   hard limit.
3. **Over time.** The app shows a trend per skill and how ready the player is
   for the next level, and suggests a level change when the logged evidence
   supports it.

The exact moment of use is not settled. It is close to play: just before, just
after, or both. Do not design for long sessions at home.

### Evidence

Progress must rest on evidence, not on how the player feels that day. The
current Solid / Working / Missing tap-to-rate is self-opinion and is not enough
on its own. Two kinds of evidence were chosen:

- **Drill scores.** Countable results from solo or paired drills, for example
  "consecutive straight drives landing behind the service box: 14".
- **Match results.** Win or loss, plus the top reasons points were lost.

The app asks for whichever fits the session type. Match logging should be as
simple as it can be while still producing data that changes the guidance.

Proposed match log (assumption): result, opponent strength relative to the
player (weaker, similar, stronger), and up to three loss reasons picked from a
short list of tags. Each tag maps to a skill, so a repeated loss reason raises
that skill in the next focus list. This mapping is what makes a 30-second log
useful.

### Level

- Selecting a level is optional. There is no assessment questionnaire.
- A player who skips it still gets a sensible default view.
- The app suggests moving up, or down, from logged evidence. This is the answer
  to inaccurate club ratings.

## 4. Visuals

Visuals are a headline feature, not decoration. The owner wants to see the
skill: ball path, movement, swing path, grip. They should help understanding
and be a pleasure to watch.

Decision for v1: **coded animations**. Every skill and drill gets an animated
court visual in one consistent style, showing ball trajectory, target zones,
player movement and recovery to the T.

Deferred to later versions, in rough order of feasibility:

- Embedded real video for body mechanics such as grip and swing.
- A 3D animated player.

Avoid AI-generated clips for technique. A clip that looks right but shows a
wrong wrist or racquet face teaches a bad habit.

The owner's long-term wish is visuals "as realistic as possible, or really
great animation". Build the animation system so a richer renderer can replace
it later without rewriting the content.

Grip and swing path are hard to show from a top-down court. Assumption: v1
covers them with simple side-on or close-up animated diagrams, and accepts that
this is the weakest part of the visuals until video arrives.

## 5. Look and feel

Playful and clean. The owner's references:

- **Airbnb** for overall vibe: warm, friendly, generous spacing, rounded
  shapes, confident photography-scale visuals, one warm accent.
- **Notion** for simplicity and organisation: calm structure, clear hierarchy,
  little chrome.
- **Muse** for animation quality: smooth, purposeful motion.

The current page is darker and more athletic (court green, ball yellow,
condensed type). Move toward lighter and warmer. Keeping a court green and a
ball yellow as brand anchors is fine. Support light and dark.

Motion should explain something or reward an action. Respect
`prefers-reduced-motion`.

## 6. Platform and data

- Phone-first web app, installable to the home screen (PWA).
- Works offline. Courts often have poor signal.
- Data lives on the device only. No login and no sync in v1.
- Offer export and import of the player's data, since a lost phone otherwise
  loses the history (assumption).

## 7. Content

- The level framework stays as the spine: 2.0 (E) through 6.0 (Pro), following
  the SquashClub.org e-Lessons guide. It can be adjusted later.
- Per level, the existing page has: fundamentals to own, shots unlocked, the
  classic trap, and a drill. It also has the four ingredients of a correct hit,
  a court diagram, and the Ten Commandments.
- **Rewrite all lesson text in original words** before anyone other than the
  owner uses the app, and keep the attribution to SquashClub.org. The current
  text is derived from their lessons.
- New content the app needs and the source does not provide: countable drills
  with a target score per level, and the loss-reason tags with their mapping to
  skills. These will be authored during the build and are assumptions until the
  owner has checked them against real play.

## 8. Scope of v1

In:

- Home screen with today's focus items
- Skill pages with animated visuals and drills
- Session logging: solo drills with scores, matches with result and loss reasons
- Progress: per-skill trend and readiness for the next level
- Level ladder as a browsable reference, replacing the current page
- Optional level selection and evidence-based level suggestions
- Installable, offline, local data, export and import

Out, for now:

- Accounts, sync, social or coach features
- Real video, 3D player, AI-generated clips
- Session planner by time available and session type (in the original README
  roadmap; a natural v2 once the core loop works)
- Point-by-point match scoring
- Native apps

## 9. Build order

1. **Scaffold and content.** Set up the app. Move the level content out of
   `index.html` into structured data.
2. **One hero skill, end to end.** Build the straight drive completely: skill
   page, animation, drill, logging, trend. Stop and get the owner's reaction to
   the visual and interaction quality before building more.
3. **Core loop.** Home focus list, session logging for drills and matches.
4. **Progress.** Trends, readiness, level suggestions.
5. **Breadth.** Remaining skills, drills and animations across the levels,
   starting with 3.0 to 4.5, the range around the owner's level.
6. **Polish.** PWA install, offline, export and import, motion and empty states.

## 10. Core loop decisions (owner, 2026-11-17)

These settle the open questions for build steps 3 and 4.

**Match log.** Win or loss, game score (one tap, e.g. 3-1), opponent weaker,
similar or stronger, and up to three loss reasons. Only the result is
required. Target: about 15 seconds.

**Loss reasons.** Eight fixed reasons, each mapped to the skill it raises on
the home screen, plus an optional "Other" with free text:

| Reason | Skill it raises |
|---|---|
| My length was short or loose | Straight drive |
| Too many balls in the tin | Consistency and shot choice |
| Beaten at the front | Front-court movement |
| Slow back to the T | Movement and the T |
| They volleyed me from the middle | Width and tightness |
| Lost points on serve or return | Serve and return |
| Ran out of energy | Fitness |
| Went for winners too early | Patience |
| Other (free text) | None: stored and shown in the match history only |

"Other" counts toward the three-reason limit. It does not affect focus
selection. If the same free-text reason keeps coming up, that is a signal to
add it as a ninth fixed reason.

**Drill targets.** Keep the first-draft targets (drive streak: 3.5 = 15 in a
row). Check them against the owner's first five logged sessions and adjust if
the owner's typical score is far from the 3.5 target.

**Home screen focus.** One to three items, each with a one-line reason.
Priority:

1. Loss reasons picked in the last three matches (a reason picked twice puts
   its skill first).
2. Drills where the typical score is below the player's level target.
3. Skills not practised in 14 days.

**Level change.** Deliberately loose for now. The owner is not yet sure the
feature is useful or what the logic should be, so:

- Build it as a simple, clearly labelled suggestion, never automatic.
- Starting rule: drill scores meet the next level's targets and the player
  wins most recent matches against similar opponents.
- Keep the thresholds in one place so they are easy to change, and do not
  build heavy machinery around them. Refine after real use.

## 11. Open questions

- Where to host it. GitHub Pages is the assumed default.
- The app's name.
- The exact level-change rule, once there is real usage to judge it by.
