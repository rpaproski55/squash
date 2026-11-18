import { motion } from 'motion/react'
import { DRILLS, getSkill } from '../content/skills'
import { focusList, type FocusItem } from '../data/focus'
import { summarise, type SideSummary } from '../data/drillStats'
import { useAllDrillResults, useLevelSuggestion, useMatches, usePlayerLevel } from '../data/hooks'
import type { DrillResult } from '../data/db'
import type { LevelId } from '../content/types'
import type { LogMode } from '../ui/LogSheet'
import { CourtStage } from '../ui/CourtStage'
import { Icon } from '../ui/Icon'
import { href } from '../ui/router'

/*
 * The home screen answers "what do I work on today?": one to three focus
 * items, each with a one-line reason (data/focus.ts), and logging one tap away.
 */
export function Today({ onLog, onLogSession }: { onLog: (drillId: string) => void; onLogSession: (mode: LogMode) => void }) {
  const results = useAllDrillResults()
  const matches = useMatches()
  const [level] = usePlayerLevel()
  const items = focusList({ matches, results, level, now: Date.now() })
  const { suggestion } = useLevelSuggestion()
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="screen stack" style={{ paddingTop: 20, gap: 20 }}>
      <header className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">{today}</span>
        <h1 className="title-xl">What to work on today</h1>
      </header>

      {items.map((item, i) => (
        <motion.div key={item.area.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}>
          <FocusCard item={item} n={i + 1} hero={i === 0} results={results} level={level} onLog={onLog} />
        </motion.div>
      ))}

      <section className="card stack" style={{ gap: 12 }}>
        <div>
          <b>Played today?</b>
          <p className="faint">Log it in under a minute. It shapes this list.</p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => onLogSession('drill')}>
            <Icon name="plus" size={20} /> Drill score
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onLogSession('match')}>
            <Icon name="plus" size={20} /> Match
          </button>
        </div>
      </section>

      {suggestion && (
        <a className="card row suggestion" href={href('progress')} style={{ textDecoration: 'none' }}>
          <div style={{ flex: 1 }}>
            <span className="eyebrow" style={{ color: 'var(--accent)' }}>Level suggestion</span>
            <b style={{ display: 'block' }}>{suggestion.kind === 'start' ? `Your scores match ${suggestion.to}` : suggestion.kind === 'up' ? `Ready for ${suggestion.to}?` : `Try ${suggestion.to} for a while?`}</b>
            <p className="faint">See why on Progress.</p>
          </div>
          <Icon name="chevron" />
        </a>
      )}

      {!level && !suggestion && (
        <a className="card row" href={href('levels')} style={{ textDecoration: 'none' }}>
          <div style={{ flex: 1 }}>
            <b>Pick your level, if you like</b>
            <p className="faint">It sets which targets you chase. You can skip it.</p>
          </div>
          <Icon name="chevron" />
        </a>
      )}
    </div>
  )
}

function FocusCard({ item, n, hero, results, level, onLog }: {
  item: FocusItem
  n: number
  hero: boolean
  results: DrillResult[]
  level: LevelId | null
  onLog: (drillId: string) => void
}) {
  const skill = item.area.skillId ? getSkill(item.area.skillId) : undefined
  const drill = skill ? DRILLS.find((d) => d.skillId === skill.id) : undefined
  const line = (s: SideSummary) =>
    `${s.side === 'forehand' ? 'Forehand' : 'Backhand'}: ${s.typical === null ? 'no score yet' : `typical ${s.typical}${s.next ? ` · target ${s.next.target}` : ''}`}`

  return (
    <article className={`card ${hero && skill ? 'flush' : ''} focus-card`}>
      {hero && skill && (
        <a href={href('skill', skill.id)} style={{ textDecoration: 'none', display: 'block' }} aria-label={`Open ${skill.name}`}>
          <CourtStage setId={skill.sceneId} compact />
        </a>
      )}
      <div className="stack" style={{ padding: hero && skill ? 18 : 0, gap: 12 }}>
        <div className="row">
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>Focus {n}</span>
          <span className="spacer" />
          {skill && <span className="tag">From {skill.fromLevel}</span>}
        </div>
        <div>
          <h2 className={hero ? 'title-l' : 'title-m'}>{item.area.name}</h2>
          <p className="focus-reason">{item.reason}</p>
        </div>
        {skill && drill ? (
          <>
            {hero && (
              <div className="small muted" style={{ display: 'grid', gap: 2 }}>
                {drill.sides.map((side) => <span key={side}>{line(summarise(drill, results, side, level))}</span>)}
              </div>
            )}
            <div className="row" style={{ gap: 10 }}>
              <a className="btn btn-ghost" href={href('skill', skill.id)} style={{ flex: 1, textDecoration: 'none' }}>Learn it</a>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onLog(drill.id)}>
                <Icon name="plus" size={20} /> Log score
              </button>
            </div>
          </>
        ) : (
          <p className="muted small">{item.area.tip}</p>
        )}
      </div>
    </article>
  )
}
