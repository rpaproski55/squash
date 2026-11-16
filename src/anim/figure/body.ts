/** Figure dimensions in metres (POSES.md, "Body"). Height about 1.74 m. */
export const BODY = {
  hipHalf: 0.10,
  thigh: 0.43,
  shin: 0.42,
  ankle: 0.08,
  footHeel: 0.06,
  footToe: 0.18,
  spine: 0.48,
  shoulderHalf: 0.19,
  neck: 0.23,
  headR: 0.105,
  upperArm: 0.29,
  forearm: 0.26,
  /** Wrist to the centre of the racquet head. */
  racquetReach: 0.50,
  /** Racquet head half-axes. */
  headLong: 0.115,
  headWide: 0.09,
  /** Racquet butt behind the wrist. */
  butt: 0.07,
  stepLift: 0.13,
} as const

/** Limb capsule radii in metres, [near end, far end]. Used by renderers. */
export const LIMB_RADII = {
  thigh: [0.085, 0.062],
  shin: [0.058, 0.042],
  foot: [0.045, 0.036],
  upper: [0.052, 0.043],
  fore: [0.04, 0.032],
  hand: 0.045,
  neck: [0.05, 0.05],
  torsoTop: 0.105,
  torsoBot: 0.10,
  shoulderBar: 0.07,
  hipBar: 0.085,
} as const
