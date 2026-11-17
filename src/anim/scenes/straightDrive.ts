import { BOX_BACK, COURT, RACQUET } from '../court'
import type { BallPoint, Caption, Player, Scene, SceneSet, Zone } from '../types'

/*
 * Forehand straight drive from the back right corner, right-handed player.
 * Times are scene seconds, roughly 2.5x slower than real play.
 */

const G = 3

const ZONES: Zone[] = [
  { id: 'front-target', kind: 'target', surface: 'front', x: COURT.width - 1.1, z: COURT.serviceLine + 0.17, w: 1.1, h: 0.42, label: 'Aim here' },
  { id: 'floor-target', kind: 'target', surface: 'floor', x: COURT.width - RACQUET, y: BOX_BACK, w: RACQUET, h: COURT.length - BOX_BACK, label: 'Good length' },
]

/**
 * The figure needs 2.0 s before contact to split step and take four steps, so
 * every time in these scenes is 0.8 s later than in the first build
 * (docs/animation/ARCHITECTURE.md, "Lead-in"). The ball does not exist before
 * its first waypoint, so the first 0.8 s shows the player ready on the T.
 */
export const LEAD = 0.8
/** Scene time of the strike. */
export const STRIKE = 1.2 + LEAD
const shift = (pts: BallPoint[]): BallPoint[] => pts.map((p) => ({ ...p, t: p.t + LEAD }))
/** Captions are authored relative to the strike, like the poses. */
const at = (caps: Caption[]): Caption[] => caps.map((c) => ({ ...c, t: c.t + STRIKE }))

/** The loose ball the opponent gives you, arriving in the back right. */
const FEED: BallPoint[] = [
  { t: 0, x: 3.6, y: 0, z: 1.4, event: 'feed' },
  { t: 0.75, x: 5.2, y: 6.9, z: 0, event: 'bounce' },
  { t: 1.2, x: 5.6, y: 8.4, z: 0.55, event: 'strike' },
]

/** Floor point under the contact. */
export const ANCHOR = { x: 5.6, y: 8.4 }

const YOU: Player = {
  id: 'you',
  role: 'you',
  label: 'You',
  motion: [{ clip: 'forehand-drive-classic', at: STRIKE, anchor: ANCHOR }],
}

const good: Scene = {
  id: 'good',
  label: 'Good length',
  tone: 'good',
  duration: 4.4 + LEAD,
  gravity: G,
  ball: shift([
    ...FEED,
    { t: 1.75, x: 5.95, y: 0, z: 2.15, event: 'front', mark: 'good' },
    { t: 2.55, x: 6.0, y: 7.7, z: 0, event: 'bounce', mark: 'good' },
    { t: 2.95, x: 6.08, y: COURT.length, z: 0.35, event: 'back' },
    { t: 3.3, x: 6.1, y: 9.3, z: 0, event: 'bounce' },
    { t: 3.9, x: 6.12, y: 9.0, z: 0, event: 'roll' },
  ]),
  players: [YOU],
  zones: ZONES,
  captions: at([
    { t: -2.0, text: 'Watch the ball, racquet ready' },
    { t: -1.45, text: 'Racquet up early', cue: 0, mark: 'racquet' },
    { t: -0.62, text: 'Side-on, front foot to the wall', cue: 1, mark: 'foot' },
    { t: -0.03, text: 'Contact level with the front foot', cue: 1, mark: 'contact' },
    { t: 0.12, text: 'Aim just above the service line', cue: 2 },
    { t: 0.62, text: 'Straight back to the T', cue: 4 },
    { t: 1.35, text: 'Lands behind the box, dies in the corner', cue: 3, tone: 'good' },
  ]),
}

// Misses keep the good swing until step 7 of PLAN.md, so their captions describe only the ball.
const short: Scene = {
  id: 'short',
  label: 'Too short',
  tone: 'bad',
  duration: 4.4 + LEAD,
  gravity: G,
  ball: shift([
    ...FEED,
    { t: 1.75, x: 5.9, y: 0, z: 1.75, event: 'front', mark: 'bad' },
    { t: 2.35, x: 5.95, y: 5.6, z: 0, event: 'bounce', mark: 'bad' },
    { t: 3.45, x: 6.0, y: 8.3, z: 0, event: 'bounce' },
    { t: 4.0, x: 6.0, y: 8.8, z: 0, event: 'roll' },
  ]),
  players: [YOU],
  zones: ZONES,
  captions: at([
    { t: -2.0, text: 'Same swing, aimed too low' },
    { t: 0.55, text: 'Hits the wall near the service line' },
    { t: 1.15, text: 'Lands short and sits up mid-court', tone: 'bad' },
  ]),
}

const loose: Scene = {
  id: 'loose',
  label: 'Off the wall',
  tone: 'bad',
  duration: 4.4 + LEAD,
  gravity: G,
  ball: shift([
    ...FEED,
    { t: 1.75, x: 5.2, y: 0, z: 2.1, event: 'front' },
    { t: 2.55, x: 4.5, y: 7.7, z: 0, event: 'bounce', mark: 'bad' },
    { t: 2.95, x: 4.25, y: COURT.length, z: 0.35, event: 'back' },
    { t: 3.3, x: 4.2, y: 9.3, z: 0, event: 'bounce' },
    { t: 3.9, x: 4.15, y: 9.0, z: 0, event: 'roll' },
  ]),
  players: [YOU],
  zones: ZONES,
  captions: at([
    { t: -2.0, text: 'Watch where this one lands' },
    { t: 0.55, text: 'Angles off the wall' },
    { t: 1.35, text: 'Deep, but in the middle: easy to volley from the T', tone: 'bad' },
  ]),
}

const long: Scene = {
  id: 'long',
  label: 'Too hard',
  tone: 'bad',
  duration: 4.6 + LEAD,
  gravity: G,
  ball: shift([
    ...FEED,
    { t: 1.65, x: 5.95, y: 0, z: 2.9, event: 'front' },
    { t: 2.3, x: 6.0, y: 8.9, z: 0, event: 'bounce' },
    { t: 2.5, x: 6.05, y: COURT.length, z: 1.1, event: 'back', mark: 'bad' },
    { t: 3.4, x: 6.0, y: 6.9, z: 0, event: 'bounce', mark: 'bad' },
    { t: 4.0, x: 5.95, y: 6.3, z: 0, event: 'roll' },
  ]),
  players: [YOU],
  zones: ZONES,
  captions: at([
    { t: -2.0, text: 'Hit high and hard' },
    { t: 1.3, text: 'Slams the back wall' },
    { t: 2.2, text: 'Pops back out for an easy ball', tone: 'bad' },
  ]),
}

export const STRAIGHT_DRIVE: SceneSet = { id: 'straight-drive', variants: [good, short, loose, long] }

/* ---------- Drill: drive streak ---------- */

function drillScene(): Scene {
  const C = 1.7
  const ball: BallPoint[] = [{ t: 0, x: 5.6, y: 8.1, z: 0.95, event: 'feed' }]
  const keys: NonNullable<Player['keys']> = [{ t: 0, x: 5.05, y: 7.95 }]
  const counter: NonNullable<Scene['counter']> = [{ t: 0, value: 0 }]
  const captions: Scene['captions'] = [{ t: 0, text: 'Drive to yourself, down the same wall' }]
  const goodShots = 5
  for (let k = 0; k <= goodShots; k++) {
    const s = 0.3 + k * C
    const bad = k === goodShots
    keys.push({ t: s, x: 5.05, y: 7.95, swing: 'forehand' })
    keys.push({ t: s + 0.8, x: 5.1 + (k % 2) * 0.08, y: 7.85 })
    ball.push({ t: s, x: 5.6, y: 8.1, z: 0.55, event: 'strike' })
    if (!bad) {
      ball.push({ t: s + 0.55, x: 5.95, y: 0, z: 2.15, event: 'front' })
      ball.push({ t: s + 1.3, x: 6.02, y: 7.5, z: 0, event: 'bounce', mark: 'good' })
      counter.push({ t: s + 1.3, value: k + 1, tone: 'good' })
      if (k === 0) captions.push({ t: s + 1.3, text: 'Deep and within a racquet of the wall: counts', tone: 'good' })
      if (k === 1) captions.push({ t: s + 1.3, text: 'Keep the streak going' })
    } else {
      ball.push({ t: s + 0.55, x: 5.9, y: 0, z: 1.8, event: 'front' })
      ball.push({ t: s + 1.15, x: 5.95, y: 6.2, z: 0, event: 'bounce', mark: 'bad' })
      ball.push({ t: s + 2.0, x: 5.9, y: 8.3, z: 0, event: 'bounce' })
      ball.push({ t: s + 2.6, x: 5.85, y: 8.9, z: 0, event: 'roll' })
      counter.push({ t: s + 1.15, value: 0, tone: 'bad' })
      captions.push({ t: s + 1.15, text: 'Short. Back to zero. Your best was 5', tone: 'bad' })
    }
  }
  const end = ball[ball.length - 1].t
  return {
    id: 'drill',
    label: 'Drive streak',
    duration: end + 0.8,
    gravity: G,
    ball,
    players: [{ id: 'you', role: 'you', label: 'You', keys }],
    zones: [ZONES[1]],
    captions,
    counter,
  }
}

export const DRIVE_STREAK: SceneSet = { id: 'drive-streak', variants: [drillScene()] }
