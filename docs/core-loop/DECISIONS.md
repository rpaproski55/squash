# Core loop decisions (build steps 3 and 4)

Running log for Track B: the home focus list, session logging, progress and
the level-change suggestion. The owner's decisions are in
`docs/PRODUCT_BRIEF.md`, section 10; this file records how they were built and
the choices made along the way. Screenshots of each step sit next to it.

## Build step 3: home focus list and session logging, 2026-11-17

- **Focus areas.** The eight loss reasons map to eight areas (section 10).
  Only the straight drive has a skill page and a drill today, so the other
  seven are `FOCUS_AREAS` with a name and a one-line tip in our own words
  (`src/content/focus.ts`). Their pages come with build step 5 (breadth).
- **Focus rules** (`src/data/focus.ts`, numbers in `FOCUS_RULES`):
  1. Fixed loss reasons from the last 3 matches; more picks first, then the
     most recent. "Other" is ignored.
  2. A drill whose typical score on either side is below the chosen level's
     target. **Choice:** without a chosen level this rule is skipped (level
     selection is optional, and there is no target to compare with).
  3. A skill with a drill that has no score in 14 days, or none ever.
  An area appears once, at its highest rule; at most 3 items. **Choice:**
  when nothing is flagged the list shows the straight drive with "Nothing
  flagged: on target and practised lately. Keep it sharp", so the home screen
  always answers the question.
- **Match log** (`src/ui/MatchForm.tsx`): Won or Lost (required, one tap),
  game score as one tap on 3-0 / 3-1 / 3-2 (or the losing equivalents),
  opponent weaker / similar / stronger, up to three of the eight reasons plus
  "Other" with free text; "Other" counts toward the three and the rest lock
  at three. **Choice:** reasons are offered for wins too ("Where you lost
  points"): a won match still has lost points. A typical log is 4 to 9 taps.
- **One log sheet** with Drill and Match tabs. The home screen has "Drill
  score" and "Match" buttons; the focus card's "Log score" opens the drill tab.
  The Save button sticks to the bottom of the sheet so it stays in reach.
- **Storage:** Dexie version 2 adds a `matches` table; drill data is kept.
- **Match history** on Progress: result, games, opponent, reasons and the
  "Other" text (the only place it appears), with delete. Trends and the
  level suggestion are build step 4.
- Checked in Chromium at 390 px, light and dark, by tapping through the real
  UI: a new player gets the straight drive; two logged matches with "Beaten
  at the front" put front-court movement first ("in both your last two
  matches"); the fourth reason locks at three; "Other: Bad shoes" shows in
  match history only. No console errors, no horizontal scroll.
