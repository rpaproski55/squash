/*
 * What a lost point says about what to practise. The loss reasons and their
 * mapping come from the owner (docs/PRODUCT_BRIEF.md, section 10). Tips are in
 * our own words.
 */

/**
 * A focus area: what the home screen can tell a player to work on. Areas with
 * a skill page link to it; the others show a one-line tip until their page is
 * built (build step 5, breadth).
 */
export interface FocusArea {
  id: string
  name: string
  /** One line on what to do about it, shown when there is no skill page yet. */
  tip: string
  /** Skill page, when one exists. */
  skillId?: string
}

export const FOCUS_AREAS: FocusArea[] = [
  { id: 'straight-drive', name: 'Straight drive', skillId: 'straight-drive', tip: 'Deep and tight down the wall, landing behind the service box.' },
  { id: 'consistency', name: 'Consistency and shot choice', tip: 'Aim a little higher above the tin and play the percentage shot until the opening is real.' },
  { id: 'front-court', name: 'Front-court movement', tip: 'Lunge with the racquet foot forward, stay balanced, and push straight back to the T.' },
  { id: 'movement-t', name: 'Movement and the T', tip: 'After every shot, back to the T with the racquet up before your opponent hits.' },
  { id: 'width', name: 'Width and tightness', tip: 'Cross-courts wide past your opponent, drives tight to the wall: nothing through the middle.' },
  { id: 'serve-return', name: 'Serve and return', tip: 'Serve high to the back corner; return straight and deep before trying anything clever.' },
  { id: 'fitness', name: 'Fitness', tip: 'Short court sprints and ghosting: squash is repeated bursts, so train in bursts.' },
  { id: 'patience', name: 'Patience', tip: 'Play length until you get a loose ball in front of you. Earn the short shot.' },
]

export interface LossReason {
  id: string
  label: string
  /** Focus area this reason raises on the home screen. */
  areaId: string
}

/** The eight fixed reasons. "Other" is separate: free text, stored, never used for focus. */
export const LOSS_REASONS: LossReason[] = [
  { id: 'length', label: 'My length was short or loose', areaId: 'straight-drive' },
  { id: 'tin', label: 'Too many balls in the tin', areaId: 'consistency' },
  { id: 'front', label: 'Beaten at the front', areaId: 'front-court' },
  { id: 't', label: 'Slow back to the T', areaId: 'movement-t' },
  { id: 'volleyed', label: 'They volleyed me from the middle', areaId: 'width' },
  { id: 'serve', label: 'Lost points on serve or return', areaId: 'serve-return' },
  { id: 'energy', label: 'Ran out of energy', areaId: 'fitness' },
  { id: 'winners', label: 'Went for winners too early', areaId: 'patience' },
]

/** Up to three reasons per match; "Other" counts toward the three. */
export const MAX_LOSS_REASONS = 3

export const getFocusArea = (id: string) => FOCUS_AREAS.find((a) => a.id === id)
export const getLossReason = (id: string) => LOSS_REASONS.find((r) => r.id === id)
