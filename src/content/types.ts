/**
 * Content types. Everything the app teaches is plain data so it can be
 * reviewed, rewritten and extended without touching the interface.
 */

export type LevelId = '2.0' | '2.5' | '3.0' | '3.5' | '4.0' | '4.5' | '5.0' | '5.5' | '6.0'

export interface Source {
  label: string
  url: string
}

export interface Fundamental {
  id: string
  title: string
  detail: string
  /** Skill page that teaches this, when one exists. */
  skillId?: string
}

export interface Level {
  id: LevelId
  grade: string
  /** One-line theme for the level. */
  theme: string
  summary: string
  fundamentals: Fundamental[]
  shotsUnlocked: string[]
  trap: { title: string; detail: string }
  drill: { title: string; detail: string }
  sources: Source[]
}

export type Side = 'forehand' | 'backhand'

export interface Drill {
  id: string
  skillId: string
  name: string
  /** Short description shown on cards. */
  tagline: string
  setup: string[]
  /** What one point of score means, in plain words. */
  scoring: string
  /** Unit label for the score, e.g. "in a row". */
  unit: string
  sides: Side[]
  /**
   * Target score per level. ASSUMPTION: authored for v1, to be checked by
   * the owner against real play. A level is "met" when a typical recent
   * score reaches its target.
   */
  targets: Partial<Record<LevelId, number>>
  /** Animation scene id that demonstrates the drill. */
  sceneId: string
  maxScore: number
}

export interface Skill {
  id: string
  name: string
  /** The level where the skill becomes a priority. */
  fromLevel: LevelId
  tagline: string
  why: string
  /** Short coaching cues, each tied to a moment in the animation. */
  cues: { title: string; detail: string }[]
  misses: { id: string; title: string; detail: string; fix: string }[]
  sceneId: string
  drillIds: string[]
  sources: Source[]
}
