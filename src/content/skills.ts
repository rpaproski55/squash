import type { Drill, Skill } from './types'

const BASE = 'https://squashclub.org/main/e-lessons/lessons'

export const SKILLS: Skill[] = [
  {
    id: 'straight-drive',
    name: 'Straight drive',
    fromLevel: '2.5',
    tagline: 'Deep, tight, down the wall. The shot every rally is built on.',
    why:
      'A straight drive that lands behind the service box and hugs the side wall pushes your opponent into the back corner and leaves them one safe reply: straight back. You get time to reach the T, and they cannot attack. Most rallies at every level, pros included, are made of this shot.',
    cues: [
      { title: 'Racquet up early', detail: 'Get it up and back while you move, so you arrive ready to swing.' },
      { title: 'Side-on, front foot to the wall', detail: 'Step in with the front foot pointing at the side wall and stay low.' },
      { title: 'Aim above the service line', detail: 'About a foot to a foot and a half above it, close to the side wall.' },
      { title: 'Land it behind the box', detail: 'First bounce behind the service box, then the ball dies in the back corner.' },
      { title: 'Straight back to the T', detail: 'Leave the corner the way you came in and be on the T, racquet up, before they hit.' },
    ],
    misses: [
      {
        id: 'short',
        title: 'Too short',
        detail: 'Lands in front of the back of the service box and sits up in mid-court.',
        fix: 'Aim higher on the front wall, not harder. Height buys length.',
      },
      {
        id: 'loose',
        title: 'Off the wall',
        detail: 'Drifts into the middle, where your opponent volleys it from the T.',
        fix: 'Stay side-on and hit the ball level with your front foot, not ahead of it.',
      },
      {
        id: 'long',
        title: 'Too hard off the back',
        detail: 'Hits the back wall high and pops out, giving them an easy ball.',
        fix: 'Take some pace off. The first bounce, not the back wall, should do the work.',
      },
    ],
    sceneId: 'straight-drive',
    drillIds: ['drive-streak'],
    sources: [
      { label: 'How to hit the ball', url: `${BASE}/beginner_lessons/hit.shtml` },
      { label: 'Training tips for D players', url: `${BASE}/beginner_lessons/lesson2.shtml` },
      { label: 'Tips for 4.0 players', url: `${BASE}/advanced_lessons/hard_or_soft.shtml` },
    ],
  },
]

export const DRILLS: Drill[] = [
  {
    id: 'drive-streak',
    skillId: 'straight-drive',
    name: 'Drive streak',
    tagline: 'Straight drives in a row, each one landing deep and tight.',
    setup: [
      'On your own, stand behind the service box on one side.',
      'Hit straight drives to yourself, down the same wall.',
      'A drive counts if its first bounce is behind the service box and within a racquet length of the side wall.',
      'Miss one and the count goes back to zero. Log your best streak.',
    ],
    scoring: 'Best number of good drives in a row',
    unit: 'in a row',
    sides: ['forehand', 'backhand'],
    // ASSUMPTION: first-draft targets, to be checked against real play.
    targets: { '2.5': 5, '3.0': 10, '3.5': 15, '4.0': 25, '4.5': 35, '5.0': 50 },
    sceneId: 'drive-streak',
    maxScore: 200,
  },
]

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id)
}

export function getDrill(id: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id)
}
