import { describe, expect, it } from 'vitest'
import { BOX_BACK, COURT, RACQUET } from './court'
import { SCENE_SETS } from './scenes'
import { STRAIGHT_DRIVE, STRIKE } from './scenes/straightDrive'
import { ballAt, samplePath } from './trajectory'
import type { Scene } from './types'

const allScenes: Scene[] = Object.values(SCENE_SETS).flatMap((s) => s.variants)

/** First floor bounce after the first strike. */
function firstBounceAfterStrike(scene: Scene) {
  const strike = scene.ball.findIndex((p) => p.event === 'strike')
  return scene.ball.slice(strike + 1).find((p) => p.event === 'bounce')!
}
const inFloorTarget = (p: { x: number; y: number }) => p.y >= BOX_BACK && p.x >= COURT.width - RACQUET

describe('trajectory', () => {
  it('passes through every waypoint', () => {
    for (const scene of allScenes) {
      for (const p of scene.ball) {
        const at = ballAt(scene.ball, p.t, scene.gravity)!
        expect(at.x).toBeCloseTo(p.x, 6)
        expect(at.y).toBeCloseTo(p.y, 6)
        expect(at.z).toBeCloseTo(p.z, 6)
      }
    }
  })

  it('is hidden before the first point and holds after the last', () => {
    const s = STRAIGHT_DRIVE.variants[0]
    expect(ballAt(s.ball, -1, s.gravity)).toBeNull()
    const last = s.ball[s.ball.length - 1]
    expect(ballAt(s.ball, 99, s.gravity)).toEqual({ x: last.x, y: last.y, z: last.z })
  })
})

describe('scenes stay physically plausible', () => {
  it.each(allScenes.map((s) => [s.id, s] as const))('%s stays inside the court', (_id, scene) => {
    for (const p of samplePath(scene.ball, scene.gravity, 0, scene.duration)) {
      expect(p.z).toBeGreaterThanOrEqual(-0.01)
      expect(p.z).toBeLessThan(COURT.frontOut)
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(COURT.width)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(COURT.length)
    }
  })

  it('front wall hits are above the tin', () => {
    for (const scene of allScenes)
      for (const p of scene.ball.filter((b) => b.event === 'front')) expect(p.z).toBeGreaterThan(COURT.tin)
  })
})

describe('the straight drive teaches the right thing', () => {
  const byId = Object.fromEntries(STRAIGHT_DRIVE.variants.map((v) => [v.id, v]))

  it('the good drive lands in the target and is struck above the service line', () => {
    expect(inFloorTarget(firstBounceAfterStrike(byId.good))).toBe(true)
    expect(byId.good.ball.find((p) => p.event === 'front')!.z).toBeGreaterThan(COURT.serviceLine)
  })

  it('the short drive lands in front of the back of the service box', () => {
    expect(firstBounceAfterStrike(byId.short).y).toBeLessThan(BOX_BACK)
  })

  it('the loose drive is deep but too far from the wall', () => {
    const b = firstBounceAfterStrike(byId.loose)
    expect(b.y).toBeGreaterThan(BOX_BACK)
    expect(inFloorTarget(b)).toBe(false)
  })

  it('the hard drive comes back out short of the box', () => {
    const bounces = byId.long.ball.filter((p) => p.event === 'bounce')
    expect(bounces[bounces.length - 1].y).toBeLessThan(BOX_BACK)
  })
})

describe('the drill counter matches the bounces', () => {
  const drill = SCENE_SETS['drive-streak'].variants[0]
  it('counts only bounces in the target and resets on a miss', () => {
    const marked = drill.ball.filter((p) => p.event === 'bounce' && p.mark)
    const counts = drill.counter!.slice(1)
    expect(counts).toHaveLength(marked.length)
    marked.forEach((b, i) => {
      expect(counts[i].t).toBeCloseTo(b.t)
      expect(inFloorTarget(b)).toBe(b.mark === 'good')
      if (b.mark === 'bad') expect(counts[i].value).toBe(0)
    })
  })
})

describe('teaching moments (DIRECTION.md table)', () => {
  it('the good drive marks the racquet, the front foot and the contact at their times', () => {
    const good = STRAIGHT_DRIVE.variants[0]
    const marks = good.captions.filter((c) => c.mark).map((c) => [c.mark, +(c.t - STRIKE).toFixed(2)])
    expect(marks).toEqual([['racquet', -1.45], ['foot', -0.62], ['contact', -0.03]])
  })
  it('misses name their body fault but draw no good-swing highlight', () => {
    for (const v of STRAIGHT_DRIVE.variants.slice(1)) {
      expect(v.captions.some((c) => c.mark)).toBe(false)
      expect(v.players[0].motion![0].overrides).toBeDefined()
    }
  })
})
