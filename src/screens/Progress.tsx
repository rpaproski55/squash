import { DRILLS } from '../content/skills'
import type { Drill } from '../content/types'
import { useDrillResults, useLevelSuggestion, useMatches, usePlayerLevel } from '../data/hooks'
import { MATCH_WINDOW, newestFirst, reasonTrends, record, type ReasonTrend } from '../data/matchStats'
import type { Match } from '../data/db'
import { DrillProgress } from '../ui/DrillProgress'
import { Segmented } from '../ui/CourtStage'
import { LevelSuggestionCard } from '../ui/LevelSuggestionCard'
import { MatchHistory } from '../ui/MatchHistory'
import { useTheme } from '../ui/theme'
import { href } from '../ui/router'
import { Icon } from '../ui/Icon'

function DrillCard({ drill }: { drill: Drill }) {
  const results = useDrillResults(drill.id)
  const [level] = usePlayerLevel()
  return (
    <section className="card stack" style={{ gap: 14 }}>
      <a className="row" href={href('skill', drill.skillId)} style={{ textDecoration: 'none' }}>
        <div style={{ flex: 1 }}>
          <h2 className="title-m">{drill.name}</h2>
          <p className="faint">{drill.scoring}</p>
        </div>
        <Icon name="chevron" />
      </a>
      <DrillProgress drill={drill} results={results} level={level} />
    </section>
  )
}

const DIR: Record<ReasonTrend['direction'], { icon: string; text: (t: ReasonTrend) => string }> = {
  better: { icon: 'down', text: (t) => `down from ${t.before}` },
  worse: { icon: 'up', text: (t) => `up from ${t.before}` },
  same: { icon: 'flat', text: () => 'same as before' },
  new: { icon: 'flat', text: () => '' },
}

function MatchesCard({ matches }: { matches: Match[] }) {
  const recent = newestFirst(matches).slice(0, MATCH_WINDOW)
  const last = record(recent)
  const all = record(matches)
  const trends = reasonTrends(matches)
  const n = recent.length
  return (
    <section className="card stack" style={{ gap: 14 }}>
      <h2 className="title-m">Matches</h2>
      {matches.length > 0 && (
        <div className="stat-row">
          <div className="stat"><b>{last.wins}–{last.losses}</b><span>Last {n}</span></div>
          <div className="stat"><b>{all.wins}–{all.losses}</b><span>All time</span></div>
          <div className="stat"><b>{matches.length}</b><span>Matches</span></div>
        </div>
      )}
      {trends.length > 0 && (
        <div className="stack" style={{ gap: 6 }}>
          <b className="small">Where you lose points</b>
          <p className="faint" style={{ marginTop: -4 }}>In your last {n} matches{trends.some((t) => t.before !== null) ? `, against the ${MATCH_WINDOW} before` : ''}.</p>
          <ul className="trend-list">
            {trends.map((t) => (
              <li key={t.reason.id}>
                <span style={{ flex: 1 }}>{t.reason.label}</span>
                <b style={{ fontVariantNumeric: 'tabular-nums' }}>{t.recent}×</b>
                {t.direction !== 'new' && (
                  <span className={`trend-dir ${t.direction}`}>
                    <Icon name={DIR[t.direction].icon} size={14} />{DIR[t.direction].text(t)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <MatchHistory matches={matches} />
    </section>
  )
}

export function Progress() {
  const [level] = usePlayerLevel()
  const [theme, setTheme] = useTheme()
  const matches = useMatches()
  const { suggestion, accept, dismiss } = useLevelSuggestion()
  return (
    <div className="screen stack" style={{ paddingTop: 20, gap: 20 }}>
      <header className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Evidence, not feelings</span>
        <h1 className="title-xl">Progress</h1>
      </header>

      {suggestion && <LevelSuggestionCard s={suggestion} onAccept={accept} onDismiss={dismiss} />}

      {DRILLS.map((d) => <DrillCard key={d.id} drill={d} />)}

      <MatchesCard matches={matches} />

      <section className="card stack" style={{ gap: 12 }}>
        <a className="row" href={href('levels')} style={{ textDecoration: 'none' }}>
          <div style={{ flex: 1 }}>
            <b>Your level</b>
            <p className="faint">{level ? `${level}, chosen by you` : 'Not set. Targets follow your scores.'}</p>
          </div>
          <Icon name="chevron" />
        </a>
        <div className="row">
          <b style={{ flex: 1 }}>Appearance</b>
          <Segmented id="theme" value={theme} onChange={(v) => setTheme(v as typeof theme)}
            options={[{ value: 'system', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        </div>
        <p className="faint">Your data stays on this phone. Nothing is uploaded.</p>
      </section>
    </div>
  )
}
