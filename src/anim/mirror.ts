import { COURT } from './court'
import type { Scene, Zone } from './types'

/**
 * The same scene for a left-hander: ball, zones and players flipped across the
 * court's long axis (x -> 6.4 - x), and each clip placement mirrored so the
 * figure swaps sides and hits with the left hand. Not offered in the interface
 * yet (DECISIONS.md); the format and the test are ready for it.
 */
export function mirrorScene(scene: Scene): Scene {
  const W = COURT.width
  const zone = (z: Zone): Zone => ({ ...z, x: W - z.x - z.w })
  return {
    ...scene,
    id: `${scene.id}-left`,
    ball: scene.ball.map((p) => ({ ...p, x: W - p.x })),
    zones: scene.zones.map(zone),
    players: scene.players.map((pl) => ({
      ...pl,
      motion: pl.motion?.map((m) => ({ ...m, anchor: { x: W - m.anchor.x, y: m.anchor.y }, mirror: !m.mirror })),
      keys: pl.keys?.map((k) => ({ ...k, x: W - k.x })),
    })),
  }
}
