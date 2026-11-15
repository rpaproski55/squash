import { motion } from 'motion/react'
import { useState } from 'react'
import { compareLevels } from '../content/levels'
import type { Drill, LevelId, Side } from '../content/types'
import { deleteResults, type DrillResult } from '../data/db'
import { seriesFor, summarise, type Trend } from '../data/drillStats'
import { Segmented } from './CourtStage'
import { Icon } from './Icon'
import { TrendChart } from './TrendChart'

const TREND: Record<Trend, { icon: string; text: string }> = {
  new: { icon: 'flat', text: 'A few more sessions to show a trend' },
  up: { icon: 'up', text: 'Trending up' },
  down: { icon: 'down', text: 'Dipping lately' },
  flat: { icon: 'flat', text: 'Holding steady' },
}

export function DrillProgress({ drill, results, level }: { drill: Drill; results: DrillResult[]; level: LevelId | null }) {
  const [side, setSide] = useState<Side>('forehand')
  const s = summarise(drill, results, side, level)
  const series = seriesFor(results, drill.id, side)
  const pct = s.next && s.typical !== null ? Math.min(1, s.typical / s.next.target) : 0

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row">
        <Segmented id={`side-${drill.id}`} value={side} onChange={(v) => setSide(v as Side)}
          options={drill.sides.map((sd) => ({ value: sd, label: sd === 'forehand' ? 'Forehand' : 'Backhand' }))} />
        <span className="spacer" />
        <span className="faint row" style={{ gap: 4 }}>
          <Icon name={TREND[s.trend].icon} size={16} /> {s.count ? TREND[s.trend].text : ''}
        </span>
      </div>

      <div className="stat-row">
        <div className="stat"><b>{s.typical ?? '–'}</b><span>Typical</span></div>
        <div className="stat"><b>{s.best ?? '–'}</b><span>Best</span></div>
        <div className="stat"><b>{s.count}</b><span>Sessions</span></div>
      </div>

      {s.next ? (
        <div className="stack" style={{ gap: 6 }}>
          <div className="row small" style={{ justifyContent: 'space-between' }}>
            <span className="muted">
              {s.typical === null ? `Start here: the ${s.next.level} target is ${s.next.target}` : `${Math.max(0, Math.ceil(s.next.target - s.typical))} to go for the ${s.next.level} target`}
            </span>
            <b>{s.next.target}</b>
          </div>
          <div className="target-bar"><motion.div initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} /></div>
        </div>
      ) : (
        <p className="small muted">You are past every target we have for this drill. Time to tell us what good looks like.</p>
      )}
      {s.levelMet && (
        <p className="small muted">Your typical score meets the <b>{s.levelMet}</b> target{level && compareLevels(s.levelMet, level) > 0 ? ', above your chosen level' : ''}.</p>
      )}

      <TrendChart series={series} target={s.next} label={`${drill.name}, ${side}`} />

      {series.length > 0 && (
        <details>
          <summary className="link-btn" style={{ listStyle: 'none' }}>Recent scores <Icon name="chevron" size={16} /></summary>
          <ul className="history">
            {series.slice(-8).reverse().map((r) => (
              <li key={r.id}>
                <span className="score">{r.score}</span>
                <span className="muted">{new Date(r.at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                <span className="spacer" />
                <button className="icon-btn" aria-label={`Delete score ${r.score}`} onClick={() => r.id && deleteResults([r.id])}><Icon name="trash" size={18} /></button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
