import type { Level, LevelId, Source } from './types'

/*
 * The level ladder, 2.0 (E) to 6.0 (Pro).
 *
 * The structure follows the SquashClub.org e-Lessons guide. All text below is
 * written in our own words; the original lessons are linked from each level.
 */

const BASE = 'https://squashclub.org/main/e-lessons/lessons'
const src = (label: string, path: string): Source => ({ label, url: `${BASE}/${path}` })

export const SOURCE_HOME: Source = {
  label: 'SquashClub.org e-Lessons',
  url: 'https://www.squashclub.org/main/e-lessons/',
}

export const LEVELS: Level[] = [
  {
    id: '2.0',
    grade: 'E',
    theme: 'Learn the game',
    summary:
      'Everything is new. Learn the rules, pick the right ball, share the court safely and get rallies going.',
    fundamentals: [
      { id: 'rules', title: 'Rules and scoring', detail: 'Where a serve has to land, the one-bounce rule, and what the tin and the out lines mean.' },
      { id: 'equipment', title: 'Gear that helps you learn', detail: 'A sensible racquet and a bouncier ball. A pro ball barely bounces until it is hot, which makes learning harder than it needs to be.' },
      { id: 'lets', title: 'Lets and strokes', detail: 'When to stop and ask for a let, when it is a stroke, and how to leave your opponent a clear path. This keeps both of you safe.' },
      { id: 'serve-basic', title: 'A serve that starts the rally', detail: 'Foot in the box, hit above the service line, land it in the far box. Reliable beats hard.' },
      { id: 'rally', title: 'Keep the ball alive', detail: 'Clean contact and getting the ball to the front wall. Long untidy rallies teach more than attempted winners.' },
    ],
    shotsUnlocked: ['Basic serve', 'Straight drive', 'Anything to the front wall'],
    trap: { title: 'Learning with a pro ball', detail: 'A cold double-dot ball hardly bounces, so every rally dies early. Start with a livelier ball and move down as you improve.' },
    drill: { title: 'Rally with a livelier ball', detail: 'Spend court time hitting with a single-dot or progress ball. Focus only on clean contact and long rallies.' },
    sources: [src('Beginner lessons', 'beginner_lessons/lesson2.shtml')],
  },
  {
    id: '2.5',
    grade: 'D',
    theme: 'Grip and stroke',
    summary:
      'Two things matter now: how you move and how you swing. Habits built here either carry you up the ladder or take months to undo.',
    fundamentals: [
      { id: 'grip', title: 'Handshake grip', detail: 'Hold the racquet as if shaking hands, with the thumb and index finger making a V along the handle. The index finger steers the racquet face.' },
      { id: 'wrist', title: 'Wrist cocked, racquet up', detail: 'Wrist set back so racquet and forearm make a right angle, head pointing at the ceiling. It shortens the path to a ready swing.' },
      { id: 'prep', title: 'Early preparation', detail: 'Get the racquet up and back before the ball arrives. A late backswing causes most errors at this level.' },
      { id: 'stance', title: 'Side-on, front foot leading', detail: 'Turn so your front foot points at the side wall. Facing the front wall leaves you only one shot: the cross-court.', skillId: 'straight-drive' },
      { id: 'lunge', title: 'Get low into the shot', detail: 'Bend and step into the ball instead of hitting upright. Being low lets you lift the ball deep and push back to the T.' },
      { id: 'stroke', title: 'Swing, do not slap', detail: 'Keep the wrist firm. Power comes from preparation and a full swing, not a flick. The wrist release comes later, once the swing is grooved.' },
      { id: 'relax', title: 'Stay loose', detail: 'Breathe in as you prepare, out as you swing. Tension is the biggest leak at D level.' },
    ],
    shotsUnlocked: ['Straight drive, both sides', 'Backhand drive', 'High deep length'],
    trap: { title: 'Hitting as hard as possible', detail: 'Pure power wins points against other beginners and teaches nothing about feel or pace. Better players simply return it.' },
    drill: { title: 'Straight drive streaks', detail: 'Alone on court, hit backhand drives down the wall that land behind the service box. Count how many in a row; restart at zero on a miss. Then switch to the forehand.' },
    sources: [
      src('The squash grip', 'beginner_lessons/grip.shtml'),
      src('How to hit the ball', 'beginner_lessons/hit.shtml'),
      src('Training tips for D players', 'beginner_lessons/lesson2.shtml'),
    ],
  },
  {
    id: '3.0',
    grade: 'D+',
    theme: 'Length and the T',
    summary:
      'Strategy begins, and it stays simple: deep balls into the back corners, then back to the T. You win by keeping the ball in front of your opponent less often than they do.',
    fundamentals: [
      { id: 'length', title: 'Good length', detail: 'Hit firmly just above the service line so the ball lands behind the service box and dies in the back corner.', skillId: 'straight-drive' },
      { id: 'corners', title: 'Aim for the back corners', detail: 'Deep corners keep your opponent behind you, which is what lets you hold the T.', skillId: 'straight-drive' },
      { id: 'tight', title: 'Hug the side wall', detail: 'A ball close to the wall forces a straight reply, so you know what is coming next.', skillId: 'straight-drive' },
      { id: 't', title: 'Back to the T every time', detail: 'Most of the court is one stride from the T. Get there after every shot and you control the rally.' },
      { id: 'watch', title: 'Watch the ball', detail: 'Onto your racquet, onto theirs, and when it goes behind you.' },
      { id: 'away', title: 'Play it where they are not', detail: 'Notice where your opponent stands and hit away from them. Attack in short bursts, then go back to solid length.' },
      { id: 'steps', title: 'Step, do not sprint', detail: 'Measured steps keep you balanced enough to play a real stroke when you arrive.' },
    ],
    shotsUnlocked: ['Length game', 'First drop shots', 'Lob to reset'],
    trap: { title: 'Going short too soon', detail: 'A drop played from a poor position just opens the court. Earn short shots with length first.' },
    drill: { title: 'Ghosting and length rallies', detail: 'Ghost from the T to each corner without a ball. Then rally with one rule: nothing short until the ball has landed behind the service box.' },
    sources: [
      src('Ten Commandments of Squash', 'intermediate_lessons/ten_commandments.shtml'),
      src('More on court strategy', 'intermediate_lessons/lesson3.shtml'),
    ],
  },
  {
    id: '3.5',
    grade: 'C',
    theme: 'Read and wait',
    summary:
      'The step up at C is reading the game: watching the ball and the opponent, guessing the likely shot, and not forcing winners that better players will return.',
    fundamentals: [
      { id: 'watch-impact', title: 'Watch through their contact', detail: 'Keep your eyes on the ball until your opponent hits it. The moment of contact tells you where it is going.' },
      { id: 'read', title: 'Read the preparation', detail: 'A big backswing means pace; a short one means drop or lob. Pick the two likeliest shots and be ready for the favourite.' },
      { id: 'split', title: 'Split-step', detail: 'A small hop as your opponent swings, so you land already moving. Standing flat on the T costs you a step.' },
      { id: 'straight', title: 'Play straight first', detail: 'The cross-court is easy to cut off. Build a straight pattern and use the cross-court as a change, never into an opponent waiting on the T.', skillId: 'straight-drive' },
      { id: 'patience', title: 'Patience over winners', detail: 'Against stronger players your winners come back. Build pressure and attack the truly loose ball.' },
      { id: 'hard-hitters', title: 'A plan for hard hitters', detail: 'Do not give them pace. Keep it tight, go high to the backhand, volley to rush them and change your own speed.' },
      { id: 'returns', title: 'Return serve with purpose', detail: 'A weak return gives away the T. Go straight and deep by default; volley a loose serve.' },
      { id: 'interference', title: 'Lets and strokes, properly', detail: 'Know the rules well enough to call them cleanly. It changes how you clear after your own shot.' },
    ],
    shotsUnlocked: ['Volley length', 'Straight drop', 'Lob', 'Drives at different paces', 'Working boast'],
    trap: { title: 'Quitting a fix during the dip', detail: 'Changing grip, stroke or tactics makes you worse for a while, sometimes for months. That dip is normal. Stick with the change.' },
    drill: { title: 'Name two shots', detail: 'In rallies, quietly name the two shots your opponent is most likely to play before they hit, then check yourself. Split-step on every swing.' },
    sources: [src('Tips for C players', 'intermediate_lessons/watch_ball.shtml')],
  },
  {
    id: '4.0',
    grade: 'C+',
    theme: 'Straight and tight',
    summary:
      'Most top-level squash is tight straight drives, volleys and drops, because a ball on the wall is the hardest one to attack. Everything else is variation.',
    fundamentals: [
      { id: 'tight-base', title: 'Tight straight game as the base', detail: 'Build rallies on balls that cling to the wall and wait for the loose reply. Their error opens the court, not your ambition.', skillId: 'straight-drive' },
      { id: 'pace-mix', title: 'Change pace on purpose', detail: 'Hard at a loose ball to rush them, high and slow when under pressure to win back the T.' },
      { id: 'deception', title: 'Disguise', detail: 'Same preparation for different shots. Take the ball early, keep the head still, and hold the shot a moment.' },
      { id: 'serves', title: 'More than one serve', detail: 'A high lob serve as the default, a hard serve at the side wall, and the occasional body serve as a surprise.' },
      { id: 'boasts', title: 'Know your boasts', detail: 'Two-wall boast to attack, three-wall to defend. Learn when each is a good idea.' },
      { id: 'temper', title: 'Keep your head', detail: 'Points lost to frustration are the cheapest points at this level, and opponents notice.' },
    ],
    shotsUnlocked: ['Lob, hard and body serves', 'Skid boast', 'Trickle boast', 'Held shots', 'Volley drop'],
    trap: { title: 'Going for the volley winner', detail: 'Volley to length first and keep them stretching. The short volley is for the chance that length creates.' },
    drill: { title: 'Show one, play another', detail: 'In pairs, the front player shows one shot and plays a different one. It trains your disguise and your partner\'s reading together.' },
    sources: [
      src('Tips for 4.0 players', 'advanced_lessons/hard_or_soft.shtml'),
      src('Service types', 'intermediate_lessons/serve.shtml'),
      src('Boast types', 'intermediate_lessons/boast.shtml'),
    ],
  },
  {
    id: '4.5',
    grade: 'B',
    theme: 'Train with intent',
    summary:
      'At B the difference is less about shots and more about how you practise: focused, T-centred, harder than a match, with real rest.',
    fundamentals: [
      { id: 't-drills', title: 'The T inside every drill', detail: 'Choose routines that make you volley and recover. In practice, go back to the T after every shot so it is automatic in matches.' },
      { id: 'hard-practice', title: 'Practise above match pace', detail: 'If training is hard enough, matches feel slow. Put a target on court for every drill.' },
      { id: 'rest', title: 'Quality and rest', detail: 'Shorter sharp sessions beat long tired ones. Stop when quality drops.' },
      { id: 'fitness', title: 'Squash fitness', detail: 'Ghosting trains the real movement. Running fitness is not the same thing.' },
      { id: 'backwall', title: 'Back-wall boast as defence', detail: 'Let the ball come close to the back wall, then lift it steeply into the front corner. Learn the straight version first.' },
      { id: 'up-down', title: 'Play up and down on purpose', detail: 'Against stronger players, extend rallies. Against weaker ones, practise your weakest patterns.' },
    ],
    shotsUnlocked: ['Back-wall boast', 'Volley boast', 'Full range of pace'],
    trap: { title: 'More hours, not better hours', detail: 'Grinding every day builds fatigue that makes you play worse.' },
    drill: { title: 'Target ghosting', detail: 'Ghost to the corners at match intensity, calling a target for each one. Every rep ends on the T with the racquet up.' },
    sources: [
      src('Training tips for B players', 'advanced_lessons/training_tips.shtml'),
      src('The back-wall boast', 'advanced_lessons/backwall_boast.shtml'),
    ],
  },
  {
    id: '5.0',
    grade: 'B+',
    theme: 'Consistency and the lob',
    summary:
      'At this level everyone gets nearly everything back. The game is quality, automatic shot choice and not beating yourself.',
    fundamentals: [
      { id: 'automatic', title: 'Automatic choices', detail: 'Drill more and play fewer matches until the right shot in each spot happens without thinking.' },
      { id: 'lob', title: 'The lob as a weapon', detail: 'Escape front-court pressure and win back the T. Disguised, it becomes an attacking shot.' },
      { id: 'plan', title: 'Hold the plan under pressure', detail: 'When pushed, players hit short balls that are not short and long balls that are not long. Keep your length and wait.' },
      { id: 'aggr-patience', title: 'Patient aggression', detail: 'Volley what is loose, but do not go for too much too early.' },
      { id: 'refs', title: 'Composure with referees', detail: 'Accept consistent calls. Arguing costs more than the call did.' },
    ],
    shotsUnlocked: ['Disguised lob', 'Full shot range under pressure'],
    trap: { title: 'Impatience', detail: 'Trying to match a stronger player\'s pressure instead of trusting depth and waiting.' },
    drill: { title: 'Drills over matches', detail: 'Shift the week toward consistency drills. More drilling, fewer games.' },
    sources: [src('Training tips for B+ players', 'advanced_lessons/5-0_tips.shtml')],
  },
  {
    id: '5.5',
    grade: 'A',
    theme: 'Control of pace',
    summary:
      'An A player can put the ball into the same corner several different ways, at different speeds, even when stretched.',
    fundamentals: [
      { id: 'paces', title: 'Many paces, one target', detail: 'Practise hitting one target area hard, medium and soft, including when rushed.' },
      { id: 'movement-auto', title: 'Movement without thought', detail: 'Footwork so grooved that your attention is free for reading the opponent.' },
      { id: 'cycles', title: 'Train in cycles', detail: 'Build, peak, ease off, rest, across the week, month and season.' },
      { id: 'fit-for-squash', title: 'Fit for squash', detail: 'Train fitness for the game, and still play real opponents.' },
    ],
    shotsUnlocked: ['Every shot at every pace', 'Disguise by default'],
    trap: { title: 'Always training flat out', detail: 'Playing hard every day causes the fatigue that stalls progress. Cycling the load is the skill.' },
    drill: { title: 'One corner, three paces', detail: 'Feed to one back corner and hit the same spot hard, medium and soft in turn.' },
    sources: [src('Optimising your training cycle', 'advanced_lessons/training.shtml')],
  },
  {
    id: '6.0',
    grade: 'Pro',
    theme: 'Attrition',
    summary:
      'Pro squash is rarely about the odd brilliant shot. Fitness, anticipation and tightness make rallies long and draining, until a weakness appears and someone pounces.',
    fundamentals: [
      { id: 'probe', title: 'Probe first', detail: 'Early rallies between equals are long and careful, testing for weaknesses and tiring the opponent.' },
      { id: 'pace-break', title: 'Pace that wears people down', detail: 'Relentless tight pace pays off late in the match.' },
      { id: 'layered', title: 'Disguise on a solid base', detail: 'Deception and volleying sit on top of the attritional game, never instead of it.' },
      { id: 'pounce', title: 'Pounce on weakness', detail: 'Patient straight length until the opening, then finish the rally.' },
    ],
    shotsUnlocked: ['Everything, chosen well'],
    trap: { title: 'Copying the highlights', detail: 'The spectacular shots are the last ten percent. Pros win with the tight straight game you are building now.' },
    drill: { title: 'Watch a pro match for length', detail: 'Count how many shots in a rally are straight and deep. It is usually most of them.' },
    sources: [src('What is the pro\'s strategy?', 'advanced_lessons/pros.shtml')],
  },
]

export const LEVEL_IDS: LevelId[] = LEVELS.map((l) => l.id)

export function getLevel(id: LevelId): Level {
  const level = LEVELS.find((l) => l.id === id)
  if (!level) throw new Error(`Unknown level ${id}`)
  return level
}

export function nextLevel(id: LevelId): LevelId | undefined {
  return LEVEL_IDS[LEVEL_IDS.indexOf(id) + 1]
}

export function compareLevels(a: LevelId, b: LevelId): number {
  return LEVEL_IDS.indexOf(a) - LEVEL_IDS.indexOf(b)
}
