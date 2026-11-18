import { motion } from 'motion/react'
import type { LevelSuggestion } from '../data/levelSuggestion'
import { Icon } from './Icon'

const TITLE: Record<LevelSuggestion['kind'], (s: LevelSuggestion) => string> = {
  up: (s) => `Ready for ${s.to}?`,
  down: (s) => `Try ${s.to} for a while?`,
  start: (s) => `Your scores match ${s.to}`,
}
const ACTION: Record<LevelSuggestion['kind'], (s: LevelSuggestion) => string> = {
  up: (s) => `Move to ${s.to}`,
  down: (s) => `Move to ${s.to}`,
  start: (s) => `Set ${s.to} as my level`,
}

/** A suggestion, never automatic: the player accepts it or says "Not now" (hidden for 14 days). */
export function LevelSuggestionCard({ s, onAccept, onDismiss }: { s: LevelSuggestion; onAccept: () => void; onDismiss: () => void }) {
  return (
    <motion.section className="card stack suggestion" style={{ gap: 12 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <span className="eyebrow" style={{ color: 'var(--accent)' }}>Level suggestion</span>
      <h2 className="title-l">{TITLE[s.kind](s)}</h2>
      <ul className="evidence">
        {s.because.map((b) => (
          <li key={b}><Icon name="check" size={16} /> <span>{b}</span></li>
        ))}
      </ul>
      <p className="faint">
        {s.kind === 'down'
          ? 'Easier targets for a few weeks can rebuild consistency. It is only a suggestion.'
          : 'Based on what you logged. It is only a suggestion; you decide.'}
      </p>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onDismiss}>Not now</button>
        <button className="btn btn-primary" style={{ flex: 1.4 }} onClick={onAccept}>{ACTION[s.kind](s)}</button>
      </div>
    </motion.section>
  )
}
