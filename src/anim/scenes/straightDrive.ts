import { BOX_BACK, COURT, RACQUET, T_STANCE } from '../court'
import type { BallPoint, Player, Scene, SceneSet, Zone } from '../types'

/*
 * Forehand straight drive from the back right corner, right-handed player.
 * Times are scene seconds, roughly 2.5x slower than real play.
 */

const G = 3

const ZONES: Zone[] = [
  { id: 'front-target', kind: 'target', surface: 'front', x: COURT.width - 1.1, z: COURT.serviceLine + 0.17, w: 1.1, h: 0.42, label: 'Aim here' },
  { id: 'floor-target', kind: 'target', surface: 'floor', x: COURT.width - RACQUET, y: BOX_BACK, w: RACQUET, h: COURT.length - BOX_BACK, label: 'Good length' },
]

/** The loose ball the opponent gives you, arriving in the back right. */
const FEED: BallPoint[] = [
  { t: 0, x: 3.6, y: 0, z: 1.4, event: 'feed' },
  { t: 0.75, x: 5.2, y: 6.9, z: 0, event: 'bounce' },
  { t: 1.2, x: 5.6, y: 8.4, z: 0.55, event: 'strike' },
]

const YOU: Player = {
  id: 'you',
  role: 'you',
  label: 'You',
  keys: [
    { t: 0, ...T_STANCE },
    { t: 0.85, x: 5.05, y: 8.15 },
    { t: 1.2, x: 5.05, y: 8.2, swing: 'forehand' },
    { t: 1.45, x: 5.0, y: 8.1 },
    { t: 2.35, ...T_STANCE },
  ],
}

const good: Scene = {
  id: 'good',
  label: 'Good length',
  duration: 4.4,
  gravity: G,
  ball: [
    ...FEED,
    { t: 1.75, x: 5.95, y: 0, z: 2.15, event: 'front', mark: 'good' },
    { t: 2.55, x: 6.0, y: 7.7, z: 0, event: 'bounce', mark: 'good' },
    { t: 2.95, x: 6.08, y: COURT.length, z: 0.35, event: 'back' },
    { t: 3.3, x: 6.1, y: 9.3, z: 0, event: 'bounce' },
    { t: 3.9, x: 6.12, y: 9.0, z: 0, event: 'roll' },
  ],
  players: [YOU],
  zones: ZONES,
  captions: [
    { t: 0, text: 'Racquet up early', cue: 0 },
    { t: 0.6, text: 'Side-on, front foot to the wall', cue: 1 },
    { t: 1.15, text: 'Aim just above the service line', cue: 2 },
    { t: 1.9, text: 'Straight back to the T', cue: 4 },
    { t: 2.55, text: 'Lands behind the box, dies in the corner', cue: 3, tone: 'good' },
  ],
}

const short: Scene = {
  id: 'short',
  label: 'Too short',
  duration: 4.4,
  gravity: G,
  ball: [
    ...FEED,
    { t: 1.75, x: 5.9, y: 0, z: 1.75, event: 'front', mark: 'bad' },
    { t: 2.35, x: 5.95, y: 5.6, z: 0, event: 'bounce', mark: 'bad' },
    { t: 3.45, x: 6.0, y: 8.3, z: 0, event: 'bounce' },
    { t: 4.0, x: 6.0, y: 8.8, z: 0, event: 'roll' },
  ],
  players: [YOU],
  zones: ZONES,
  captions: [
    { t: 0, text: 'Same swing, aimed too low' },
    { t: 1.75, text: 'Hits the wall near the service line' },
    { t: 2.35, text: 'Lands short and sits up mid-court', tone: 'bad' },
  ],
}

const loose: Scene = {
  id: 'loose',
  label: 'Off the wall',
  duration: 4.4,
  gravity: G,
  ball: [
    ...FEED,
    { t: 1.75, x: 5.2, y: 0, z: 2.1, event: 'front' },
    { t: 2.55, x: 4.5, y: 7.7, z: 0, event: 'bounce', mark: 'bad' },
    { t: 2.95, x: 4.25, y: COURT.length, z: 0.35, event: 'back' },
    { t: 3.3, x: 4.2, y: 9.3, z: 0, event: 'bounce' },
    { t: 3.9, x: 4.15, y: 9.0, z: 0, event: 'roll' },
  ],
  players: [YOU],
  zones: ZONES,
  captions: [
    { t: 0, text: 'Facing the front wall at contact' },
    { t: 1.75, text: 'Angles off the wall' },
    { t: 2.55, text: 'Deep, but in the middle: easy to volley from the T', tone: 'bad' },
  ],
}

const long: Scene = {
  id: 'long',
  label: 'Too hard',
  duration: 4.6,
  gravity: G,
  ball: [
    ...FEED,
    { t: 1.65, x: 5.95, y: 0, z: 2.9, event: 'front' },
    { t: 2.3, x: 6.0, y: 8.9, z: 0, event: 'bounce' },
    { t: 2.5, x: 6.05, y: COURT.length, z: 1.1, event: 'back', mark: 'bad' },
    { t: 3.4, x: 6.0, y: 6.9, z: 0, event: 'bounce', mark: 'bad' },
    { t: 4.0, x: 5.95, y: 6.3, z: 0, event: 'roll' },
  ],
  players: [YOU],
  zones: ZONES,
  captions: [
    { t: 0, text: 'Hit high and hard' },
    { t: 2.5, text: 'Slams the back wall' },
    { t: 3.4, text: 'Pops back out for an easy ball', tone: 'bad' },
  ],
}

export const STRAIGHT_DRIVE: SceneSet = { id: 'straight-drive', variants: [good, short, loose, long] }

/* ---------- Drill: drive streak ---------- */

function drillScene(): Scene {
  const C = 1.7
  const ball: BallPoint[] = [{ t: 0, x: 5.6, y: 8.1, z: 0.95, event: 'feed' }]
  const keys: Player['keys'] = [{ t: 0, x: 5.05, y: 7.95 }]
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
