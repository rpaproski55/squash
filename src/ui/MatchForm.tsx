import { useState } from 'react'
import { LOSS_REASONS, MAX_LOSS_REASONS } from '../content/focus'
import { logMatch, type MatchResult, type OpponentStrength } from '../data/db'
import { Segmented } from './CourtStage'

/*
 * Match log, about 15 seconds (docs/PRODUCT_BRIEF.md, section 10): result
 * (the only required field), game score in one tap, opponent strength, and up
 * to three reasons points were lost. "Other" takes free text and counts toward
 * the three.
 */

const SCORES: Record<MatchResult, [number, number][]> = {
  win: [[3, 0], [3, 1], [3, 2]],
  loss: [[0, 3], [1, 3], [2, 3]],
}

export function MatchForm({ onSaved }: { onSaved: (message: string) => void }) {
  const [result, setResult] = useState<MatchResult | null>(null)
  const [games, setGames] = useState<[number, number] | null>(null)
  const [opponent, setOpponent] = useState<OpponentStrength | null>(null)
  const [reasons, setReasons] = useState<string[]>([])
  const [otherOn, setOtherOn] = useState(false)
  const [other, setOther] = useState('')

  const picked = reasons.length + (otherOn ? 1 : 0)
  const full = picked >= MAX_LOSS_REASONS
  const toggle = (id: string) => setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : full ? r : [...r, id]))
  const pickResult = (r: MatchResult) => {
    setResult(r)
    setGames(null) // a 3-1 win is not a valid loss score
  }

  const save = async () => {
    if (!result) return
    const text = other.trim()
    await logMatch({
      at: Date.now(),
      result,
      ...(games && { games }),
      ...(opponent && { opponent }),
      reasons,
      ...(otherOn && text && { other: text }),
    })
    onSaved(reasons.length ? 'Match saved. Your focus list is updated.' : 'Match saved')
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="result-pick" role="group" aria-label="Result">
        <button className={`result win ${result === 'win' ? 'on' : ''}`} aria-pressed={result === 'win'} onClick={() => pickResult('win')}>Won</button>
        <button className={`result loss ${result === 'loss' ? 'on' : ''}`} aria-pressed={result === 'loss'} onClick={() => pickResult('loss')}>Lost</button>
      </div>

      {result && (
        <div className="stack" style={{ gap: 8 }}>
          <span className="field-label">Games <span className="faint">optional</span></span>
          <div className="chip-row" role="group" aria-label="Games">
            {SCORES[result].map((g) => {
              const on = games?.[0] === g[0] && games?.[1] === g[1]
              return (
                <button key={g.join('-')} className={`pick ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setGames(on ? null : g)}>
                  {g[0]}–{g[1]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="stack" style={{ gap: 8 }}>
        <span className="field-label">Opponent <span className="faint">optional</span></span>
        <Segmented
          id="opponent" value={opponent ?? ''} onChange={(v) => setOpponent(v === opponent ? null : (v as OpponentStrength))}
          options={[{ value: 'weaker', label: 'Weaker' }, { value: 'similar', label: 'Similar' }, { value: 'stronger', label: 'Stronger' }]}
        />
      </div>

      <div className="stack" style={{ gap: 8 }}>
        <span className="field-label">
          Where you lost points <span className="faint">up to {MAX_LOSS_REASONS}, optional</span>
        </span>
        <div className="reason-list" role="group" aria-label="Where you lost points">
          {LOSS_REASONS.map((r) => {
            const on = reasons.includes(r.id)
            return (
              <button key={r.id} className={`pick ${on ? 'on' : ''}`} aria-pressed={on} disabled={!on && full} onClick={() => toggle(r.id)}>
                {r.label}
              </button>
            )
          })}
          <button className={`pick ${otherOn ? 'on' : ''}`} aria-pressed={otherOn} disabled={!otherOn && full} onClick={() => setOtherOn((o) => !o)}>
            Other
          </button>
        </div>
        {otherOn && (
          <input
            className="text-input" type="text" maxLength={80} placeholder="What was it?" aria-label="Other reason"
            value={other} onChange={(e) => setOther(e.target.value)} autoFocus
          />
        )}
      </div>

      <div className="sheet-actions">
        <button className="btn btn-primary btn-block" disabled={!result} onClick={save}>
          Save match
        </button>
      </div>
    </div>
  )
}
