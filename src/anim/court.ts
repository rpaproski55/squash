/** Singles court dimensions in metres (World Squash). */
export const COURT = {
  width: 6.4,
  length: 9.75,
  frontOut: 4.57,
  serviceLine: 1.78,
  tin: 0.48,
  backOut: 2.13,
  shortLine: 5.44,
  boxSize: 1.6,
} as const

/** The T: where the short line meets the half-court line. */
export const T_POINT = { x: COURT.width / 2, y: COURT.shortLine }

/** Where a player stands to cover the T (slightly behind it). */
export const T_STANCE = { x: COURT.width / 2, y: COURT.shortLine + 0.45 }

/** Back edge of the service boxes: a good length lands beyond this. */
export const BOX_BACK = COURT.shortLine + COURT.boxSize

/** About one racquet length, used for "tight to the wall". */
export const RACQUET = 0.7

/** Height of the side-wall out line at depth y (it slopes front to back). */
export function sideOutAt(y: number): number {
  return COURT.frontOut + (COURT.backOut - COURT.frontOut) * (y / COURT.length)
}
