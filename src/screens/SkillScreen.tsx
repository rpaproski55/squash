import { motion } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { LEVEL_IDS } from '../content/levels'
import { getDrill, getSkill } from '../content/skills'
import { useDrillResults, usePlayerLevel } from '../data/hooks'
import { CourtStage } from '../ui/CourtStage'
import { DrillProgress } from '../ui/DrillProgress'
import { Icon } from '../ui/Icon'
import { href } from '../ui/router'

export function SkillScreen({ id, onLog }: { id: string; onLog: (drillId: string) => void }) {
  const skill = getSkill(id)
  const [variant, setVariant] = useState(0)
  const [cue, setCue] = useState<number | undefined>()
  const stageRef = useRef<HTMLDivElement>(null)
  const onCue = useCallback((c: number | undefined) => setCue(c), [])
  const drill = getDrill(skill?.drillIds[0] ?? '')
  const results = useDrillResults(drill?.id ?? '')
  const [level] = usePlayerLevel()

  if (!skill || !drill) return <div className="screen"><p>Skill not found.</p></div>

  const showMiss = (i: number) => {
    setVariant(i + 1)
    stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <div className="topbar">
        <a className="icon-btn" href={href()} aria-label="Back to today"><Icon name="back" /></a>
        <span className="title-m">{skill.name}</span>
      </div>

      <div className="screen stack" style={{ gap: 24 }}>
        <div ref={stageRef} className="card flush" style={{ scrollMarginTop: 64 }}>
          <div style={{ padding: '0 16px' }}>
            <CourtStage setId={skill.sceneId} variant={variant} onVariant={setVariant} showVariants onCue={onCue} />
          </div>
        </div>

        <header className="stack" style={{ gap: 6 }}>
          <div className="row"><span className="tag">A priority from {skill.fromLevel}</span></div>
          <h1 className="title-xl">{skill.name}</h1>
          <p className="muted">{skill.tagline}</p>
        </header>

        <section className="section">
          <h2 className="section-title">What to focus on</h2>
          <ol className="cue-list">
            {skill.cues.map((c, i) => (
              <li key={c.title} className={`cue ${variant === 0 && cue === i ? 'active' : ''}`}>
                <span className="cue-num">{i + 1}</span>
                <div><b>{c.title}</b><span>{c.detail}</span></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="section">
          <h2 className="section-title">Why it matters</h2>
          <p className="muted">{skill.why}</p>
        </section>

        <section className="section">
          <h2 className="section-title">Common misses</h2>
          <p className="faint" style={{ marginTop: -6 }}>Tap one to watch it.</p>
          {skill.misses.map((m, i) => (
            <motion.button key={m.id} className="miss" onClick={() => showMiss(i)} whileTap={{ scale: 0.98 }}>
              <span className="miss-icon"><Icon name="x" size={18} /></span>
              <span style={{ flex: 1 }}>
                <b>{m.title}</b>
                <span className="muted small">{m.detail}</span>
                <span className="fix">Fix: {m.fix}</span>
              </span>
              <Icon name="play" size={18} />
            </motion.button>
          ))}
        </section>

        <section className="section">
          <div>
            <span className="eyebrow">Drill</span>
            <h2 className="section-title">{drill.name}</h2>
            <p className="muted small">{drill.tagline}</p>
          </div>
          <div className="card flush">
            <CourtStage setId={drill.sceneId} />
          </div>
          <ol className="muted small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
            {drill.setup.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <div>
            <p className="small" style={{ fontWeight: 700, marginBottom: 6 }}>Targets by level</p>
            <div className="tags">
              {LEVEL_IDS.filter((l) => drill.targets[l] !== undefined).map((l) => (
                <span key={l} className="tag" style={l === level ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : undefined}>
                  {l}: {drill.targets[l]}
                </span>
              ))}
            </div>
            <p className="faint" style={{ marginTop: 6, fontSize: 13 }}>First-draft targets. They will be tuned against real sessions.</p>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => onLog(drill.id)}>
            <Icon name="plus" size={20} /> Log a score
          </button>
        </section>

        <section className="section">
          <h2 className="section-title">Your progress</h2>
          <div className="card"><DrillProgress drill={drill} results={results} level={level} /></div>
        </section>

        <footer className="source-list">
          Based on lessons from{' '}
          {skill.sources.map((s, i) => (
            <span key={s.url}>{i > 0 && ', '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>
          ))}{' '}
          at SquashClub.org, in our own words.
        </footer>
      </div>
    </div>
  )
}
