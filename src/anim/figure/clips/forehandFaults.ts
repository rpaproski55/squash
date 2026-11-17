import type { FigureTracks } from '../../types'

/*
 * Body faults for the straight drive misses (PLAN.md step 7), as overrides on
 * the classic forehand drive. Contact keys are solved, not eyeballed (method in
 * POSES.md, "Authoring another clip"): choose the racquet direction and string
 * normal in court space, put the hand 0.50 m back along the shaft from the
 * ball, convert into the chest frame at contact.
 */

/** Too short: face nearly closed (3 degrees open instead of 14) and contact 5 cm lower. */
export const FAULT_SHORT: Partial<FigureTracks> = {
  handR: [[0, [-0.052, 0.244, -0.448]]],
  racquetFace: [[0, [-0.961, 0.271, 0.049], 'peak']],
}
/** Ball 5 cm lower at contact, to match. */
export const SHORT_CONTACT_DROP = 0.05

/**
 * Off the wall: chest open at contact (45 degrees instead of 75) and contact
 * 0.25 m ahead of the front foot. The racquet is turned 3 degrees toward the
 * middle, the angle the ball actually leaves at in the scene; more would show a
 * crosscourt the ball does not hit.
 */
export const FAULT_LOOSE: Partial<FigureTracks> = {
  chestYaw: [[0, 45]],
  handR: [[0, [0.066, 0.357, -0.398]]],
  racquetDir: [[0, [0.646, 0.718, -0.26], 'peak']],
  racquetFace: [[0, [-0.682, 0.696, 0.226], 'peak']],
}
/** Contact this far ahead of the front foot (toward the front wall), to match. */
export const LOOSE_CONTACT_AHEAD = 0.25

/**
 * Too hard: face 22 degrees open at contact, and a follow-through 30 percent
 * longer: the racquet travels 30 percent more angle after contact and the hand
 * 30 percent further, capped at 0.53 m from the shoulder so the arm is not
 * stretched past reach.
 */
export const FAULT_LONG: Partial<FigureTracks> = {
  racquetFace: [[0, [-0.875, 0.332, 0.351], 'peak']],
  handR: [[0.14, [-0.146, 0.406, -0.057]], [0.4, [-0.11, 0.244, 0.363]]],
  racquetDir: [[0.14, [-0.778, -0.248, 0.578]], [0.4, [-0.321, -0.818, 0.478]]],
}
