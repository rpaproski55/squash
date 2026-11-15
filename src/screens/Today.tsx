import { getDrill, getSkill } from '../content/skills'
import { summarise } from '../data/drillStats'
import { useDrillResults, usePlayerLevel } from '../data/hooks'
import { href } from '../ui/router'
import { CourtStage } from '../ui/CourtStage'
import { Icon } from '../ui/Icon'

export function Today({ onLog }: { onLog: (drillId: string) => void }) {
  const skill = getSkill('straight-drive')!
  const drill = getDrill('drive-streak')!
  const results = useDrillResults(drill.id)
  const [level] = usePlayerLevel()
  const fh = summarise(drill, results, 'forehand', level)
  const bh = summarise(drill, results, 'backhand', level)
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  const line = (label: string, s: typeof fh) =>
    s.typical === null ? `${label}: no score yet` : `${label}: typical ${s.typical}${s.next ? ` · target ${s.next.target}` : ''}`

  return (
    <div className="screen stack" style={{ paddingTop: 20, gap: 20 }}>
      <header className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">{today}</span>
        <h1 className="title-xl">What to work on today</h1>
      </header>

      <article className="card flush">
        <a href={href('skill', skill.id)} style={{ textDecoration: 'none', display: 'block' }} aria-label={`Open ${skill.name}`}>
          <CourtStage setId={skill.sceneId} compact />
        </a>
        <div className="stack" style={{ padding: 18, gap: 12 }}>
          <div className="row">
            <span className="eyebrow" style={{ color: 'var(--accent)' }}>Focus 1</span>
            <span className="spacer" />
            <span className="tag">From {skill.fromLevel}</span>
          </div>
          <div>
            <h2 className="title-l">{skill.name}</h2>
            <p className="muted" style={{ marginTop: 4 }}>{skill.tagline}</p>
          </div>
          <div className="small muted" style={{ display: 'grid', gap: 2 }}>
            <span>{line('Forehand', fh)}</span>
            <span>{line('Backhand', bh)}</span>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <a className="btn btn-ghost" href={href('skill', skill.id)} style={{ flex: 1, textDecoration: 'none' }}>
              Learn it
            </a>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onLog(drill.id)}>
              <Icon name="plus" size={20} /> Log score
            </button>
          </div>
        </div>
      </article>

      {!level && (
        <a className="card row" href={href('levels')} style={{ textDecoration: 'none' }}>
          <div style={{ flex: 1 }}>
            <b>Pick your level, if you like</b>
            <p className="faint">It sets which targets you chase. You can skip it.</p>
          </div>
          <Icon name="chevron" />
        </a>
      )}

      <p className="faint" style={{ textAlign: 'center', padding: '0 12px' }}>
        More focus items, and match logging, come next. They will be picked from what you log.
      </p>
    </div>
  )
}
