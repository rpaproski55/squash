import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { COURT_PRINCIPLES, HIT_INGREDIENTS } from '../content/foundations'
import { LEVELS, SOURCE_HOME } from '../content/levels'
import type { Level } from '../content/types'
import { usePlayerLevel } from '../data/hooks'
import { Icon } from '../ui/Icon'
import { href } from '../ui/router'

function LevelCard({ level, mine, open, onToggle, onPick }: { level: Level; mine: boolean; open: boolean; onToggle: () => void; onPick: () => void }) {
  return (
    <article className="card flush">
      <button className="level-row" onClick={onToggle} aria-expanded={open}>
        <span className={`level-badge ${mine ? 'mine' : ''}`}><b>{level.id}</b><span>{level.grade}</span></span>
        <span style={{ flex: 1 }}>
          {mine && <span className="eyebrow" style={{ color: 'var(--accent)' }}>Your level</span>}
          <b style={{ display: 'block', fontSize: 17 }}>{level.theme}</b>
          <span className="faint">{level.fundamentals.length} fundamentals</span>
        </span>
        <motion.span animate={{ rotate: open ? 90 : 0 }} style={{ display: 'inline-flex', color: 'var(--ink-3)' }}><Icon name="chevron" /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }} style={{ overflow: 'hidden' }}>
            <div className="level-body">
              <p className="muted">{level.summary}</p>
              <div>
                <p className="eyebrow" style={{ marginBottom: 4 }}>Fundamentals</p>
                {level.fundamentals.map((f) => (
                  <div key={f.id} className="fund">
                    <b>{f.title}</b>
                    <span>{f.detail}</span>
                    {f.skillId && (
                      <a className="link-btn" href={href('skill', f.skillId)}>Watch the lesson <Icon name="chevron" size={16} /></a>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <p className="eyebrow" style={{ marginBottom: 6 }}>Shots it unlocks</p>
                <div className="tags">{level.shotsUnlocked.map((s) => <span key={s} className="tag">{s}</span>)}</div>
              </div>
              <div className="callout trap"><b>The trap: {level.trap.title}</b>{level.trap.detail}</div>
              <div className="callout drill"><b>Try this: {level.drill.title}</b>{level.drill.detail}</div>
              <p className="source-list">
                Source:{' '}
                {level.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}
              </p>
              <button className={`btn ${mine ? 'btn-ghost' : 'btn-primary'}`} onClick={onPick}>
                {mine ? 'Clear my level' : `Set ${level.id} as my level`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}

export function Levels() {
  const [level, setLevel] = usePlayerLevel()
  const [open, setOpen] = useState<string | null>(level)

  return (
    <div className="screen stack" style={{ paddingTop: 20, gap: 16 }}>
      <header className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">2.0 to 6.0</span>
        <h1 className="title-xl">The level ladder</h1>
        <p className="muted">
          Choosing a level is optional. It sets which targets you chase. Your scores will tell you when to move.
        </p>
      </header>

      {LEVELS.map((l) => (
        <LevelCard
          key={l.id} level={l} mine={l.id === level} open={open === l.id}
          onToggle={() => setOpen(open === l.id ? null : l.id)}
          onPick={() => setLevel(l.id === level ? null : l.id)}
        />
      ))}

      <section className="card stack" style={{ gap: 10 }}>
        <h2 className="title-m">Four parts of every good hit</h2>
        {HIT_INGREDIENTS.map((h, i) => (
          <div key={h.id} className="cue" style={{ padding: '6px 0' }}>
            <span className="cue-num">{i + 1}</span>
            <div><b>{h.title}</b><span>{h.detail}</span></div>
          </div>
        ))}
      </section>

      <section className="card stack" style={{ gap: 10 }}>
        <h2 className="title-m">Ten court principles</h2>
        {COURT_PRINCIPLES.map((h, i) => (
          <div key={h.id} className="cue" style={{ padding: '4px 0' }}>
            <span className="cue-num">{i + 1}</span>
            <div><b>{h.title}</b><span>{h.detail}</span></div>
          </div>
        ))}
      </section>

      <p className="source-list" style={{ textAlign: 'center' }}>
        Level structure from the <a href={SOURCE_HOME.url} target="_blank" rel="noreferrer">{SOURCE_HOME.label}</a>. Lesson text rewritten in our own words.
      </p>
    </div>
  )
}
