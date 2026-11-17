import { getLossReason } from '../content/focus'
import { deleteMatch, type Match } from '../data/db'
import { Icon } from './Icon'

const OPP = { weaker: 'vs weaker', similar: 'vs similar', stronger: 'vs stronger' } as const

/** Recent matches, newest first. "Other" text is shown here and nowhere else (it never drives focus). */
export function MatchHistory({ matches, limit = 8 }: { matches: Match[]; limit?: number }) {
  if (!matches.length) return <p className="faint">No matches yet. Log one from Today after you play.</p>
  const recent = [...matches].sort((a, b) => b.at - a.at).slice(0, limit)
  return (
    <ul className="history match-history">
      {recent.map((m) => {
        const reasons = [...m.reasons.map((id) => getLossReason(id)?.label ?? id), ...(m.other ? [`Other: ${m.other}`] : [])]
        return (
          <li key={m.id}>
            <span className={`result-badge ${m.result}`}>{m.result === 'win' ? 'W' : 'L'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 6 }}>
                <b>{m.games ? `${m.games[0]}–${m.games[1]}` : m.result === 'win' ? 'Won' : 'Lost'}</b>
                {m.opponent && <span className="faint">{OPP[m.opponent]}</span>}
                <span className="spacer" />
                <span className="faint">{new Date(m.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
              </div>
              {reasons.length > 0 && <p className="faint match-reasons">{reasons.join(' · ')}</p>}
            </div>
            <button className="icon-btn" aria-label="Delete match" onClick={() => m.id && deleteMatch(m.id)}><Icon name="trash" size={18} /></button>
          </li>
        )
      })}
    </ul>
  )
}
