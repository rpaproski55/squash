import { DRILLS } from '../content/skills'
import { useDrillResults, useMatches, usePlayerLevel } from '../data/hooks'
import { MatchHistory } from '../ui/MatchHistory'
import { DrillProgress } from '../ui/DrillProgress'
import { Segmented } from '../ui/CourtStage'
import { useTheme } from '../ui/theme'
import { href } from '../ui/router'
import { Icon } from '../ui/Icon'
import type { Drill } from '../content/types'

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

export function Progress() {
  const [level] = usePlayerLevel()
  const [theme, setTheme] = useTheme()
  const matches = useMatches()
  return (
    <div className="screen stack" style={{ paddingTop: 20, gap: 20 }}>
      <header className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Evidence, not feelings</span>
        <h1 className="title-xl">Progress</h1>
      </header>
      {DRILLS.map((d) => <DrillCard key={d.id} drill={d} />)}

      <section className="card stack" style={{ gap: 10 }}>
        <h2 className="title-m">Matches</h2>
        <MatchHistory matches={matches} />
      </section>

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
