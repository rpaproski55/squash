/*
 * Foundations that apply at every level. Our own wording; the ideas come from
 * the SquashClub.org lessons "How to hit the ball" and "The Ten Commandments
 * of Squash".
 */

export const HIT_INGREDIENTS = [
  { id: 'wrist', title: 'Wrist cocked', detail: 'Racquet and forearm at a right angle before the swing. The wrist releases through the ball and finishes pointing away.' },
  { id: 'racquet-up', title: 'Racquet up on the T', detail: 'Hold it above the waist while you wait. You can volley at once, and switching sides is a small turn of the shoulders.' },
  { id: 'side-on', title: 'Side-on to the wall', detail: 'Front foot pointing at the side wall for straight shots. Square to the front wall, you can only go cross-court.' },
  { id: 'low', title: 'Bend and lunge', detail: 'Never hit fully upright. From a low lunge you can drive, drop, lob or boast, so your opponent has to guess.' },
] as const

export const COURT_PRINCIPLES = [
  { id: 'length', title: 'Hit a good length', detail: 'Firm, just above the service line, landing behind the service box.' },
  { id: 'corner', title: 'Aim for the back corner', detail: 'It is how you keep the T.' },
  { id: 'wall', title: 'Stay close to the side wall', detail: 'Straight and tight is the safer shot.' },
  { id: 't', title: 'Recover to the T', detail: 'Most shots are one stride from it.' },
  { id: 'watch', title: 'Watch the ball', detail: 'Onto both racquets, even behind you.' },
  { id: 'move', title: 'Make them move', detail: 'Play away from your opponent, up and down the walls.' },
  { id: 'volley', title: 'Volley when you can', detail: 'To length first. Short only on a real chance.' },
  { id: 'delay', title: 'Hold the shot', detail: 'A delayed shot wrong-foots them and tires them out.' },
  { id: 'short', title: 'Earn the short ball', detail: 'Go short only after length has opened the court.' },
  { id: 'pace', title: 'Vary the pace', detail: 'It unsettles them and buys you recovery time.' },
] as const
