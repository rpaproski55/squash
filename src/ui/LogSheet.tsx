import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { Drill, Side } from '../content/types'
import { logDrillScores, type DrillResult } from '../data/db'
import { personalBest, seriesFor } from '../data/drillStats'
import { Icon } from './Icon'

const SIDE_LABEL: Record<Side, string> = { forehand: 'Forehand', backhand: 'Backhand' }

/**
 * Logging must take well under a minute: one number per side, nothing else.
 * A side left empty is simply not saved.
 */
export function LogSheet({ drill, results, open, onClose, onSaved }: {
  drill: Drill
  results: DrillResult[]
  open: boolean
  onClose: () => void
  onSaved: (message: string, celebrate: boolean) => void
}) {
  const [values, setValues] = useState<Partial<Record<Side, number>>>({})
  useEffect(() => { if (open) setValues({}) }, [open])

  const set = (side: Side, v: number | undefined) =>
    setValues((s) => ({ ...s, [side]: v === undefined ? undefined : Math.max(0, Math.min(drill.maxScore, Math.round(v))) }))
  const bump = (side: Side, d: number) => set(side, (values[side] ?? 0) + d)
  const filled = drill.sides.filter((s) => values[s] !== undefined)

  const save = async () => {
    const newBests = filled.filter((s) => {
      const pb = personalBest(seriesFor(results, drill.id, s))
      return pb !== null && values[s]! > pb
    })
    const firstEver = filled.every((s) => personalBest(seriesFor(results, drill.id, s)) === null)
    await logDrillScores(drill.id, Object.fromEntries(filled.map((s) => [s, values[s]])))
    onClose()
    if (newBests.length) onSaved(`New best on your ${newBests.map((s) => SIDE_LABEL[s].toLowerCase()).join(' and ')}!`, true)
    else if (firstEver) onSaved('Baseline set. Beat it next time.', false)
    else onSaved('Saved', false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="sheet" role="dialog" aria-modal="true" aria-labelledby="log-title"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 100) onClose() }}
          >
            <div className="grabber" />
            <div className="stack" style={{ gap: 14 }}>
              <div>
                <h2 id="log-title" className="title-l">Log {drill.name.toLowerCase()}</h2>
                <p className="faint">{drill.scoring}. Fill one side or both.</p>
              </div>
              <div className="steppers">
                {drill.sides.map((side) => {
                  const last = seriesFor(results, drill.id, side).at(-1)?.score
                  const v = values[side]
                  return (
                    <div key={side} className={`stepper ${v !== undefined ? 'on' : ''}`}>
                      <label className="stepper-label" htmlFor={`log-${side}`}>{SIDE_LABEL[side]}</label>
                      <input
                        id={`log-${side}`} type="number" inputMode="numeric" pattern="[0-9]*" min={0} max={drill.maxScore}
                        placeholder={last !== undefined ? String(last) : '0'}
                        value={v ?? ''}
                        onChange={(e) => set(side, e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                      <div className="stepper-btns">
                        <button aria-label={`${SIDE_LABEL[side]} minus one`} onClick={() => bump(side, -1)}><Icon name="minus" size={20} /></button>
                        <button aria-label={`${SIDE_LABEL[side]} plus one`} onClick={() => bump(side, 1)}><Icon name="plus" size={20} /></button>
                        <button className="wide" aria-label={`${SIDE_LABEL[side]} plus five`} onClick={() => bump(side, 5)}>+5</button>
                      </div>
                      <span className="faint" style={{ fontSize: 12.5 }}>{last !== undefined ? `Last time ${last}` : 'First time'}</span>
                    </div>
                  )
                })}
              </div>
              <button className="btn btn-primary btn-block" disabled={!filled.length} onClick={save}>
                Save {filled.length === 2 ? 'both' : ''}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Toast({ message, celebrate, onDone }: { message: string | null; celebrate: boolean; onDone: () => void }) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDone, 2600)
    return () => clearTimeout(id)
  }, [message, onDone])
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="toast" role="status"
          initial={{ opacity: 0, y: 20, x: '-50%', scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: 10, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {celebrate ? (
            <motion.span style={{ color: 'var(--ball)', display: 'inline-flex' }} initial={{ rotate: -40, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.1 }}>
              <Icon name="spark" size={20} />
            </motion.span>
          ) : (
            <Icon name="check" size={18} />
          )}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
