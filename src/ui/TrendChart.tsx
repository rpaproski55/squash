import { useState } from 'react'
import type { LevelId } from '../content/types'
import type { DrillResult } from '../data/db'

/*
 * One series per chart (one side of one drill), so no legend: the card title
 * names it. Sessions are evenly spaced, since practice is irregular and the
 * order matters more than the gaps. The dashed line is the next target.
 */

const W = 340
const H = 172
const PAD = { l: 30, r: 14, t: 18, b: 28 }

function niceMax(v: number): number {
  const steps = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200]
  return steps.find((s) => s >= v) ?? Math.ceil(v / 50) * 50
}

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

export function TrendChart({ series, target, label }: { series: DrillResult[]; target: { level: LevelId; target: number } | null; label: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = niceMax(Math.max(5, target?.target ?? 0, ...series.map((r) => r.score)) * 1.1)
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const n = series.length
  const xAt = (i: number) => PAD.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const yAt = (v: number) => PAD.t + ih - (v / max) * ih
  const ticks = [0, max / 2, max]
  const pts = series.map((r, i) => [xAt(i), yAt(r.score)] as const)

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!n) return
    const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * W
    let best = 0
    pts.forEach(([px], i) => { if (Math.abs(px - x) < Math.abs(pts[best][0] - x)) best = i })
    setHover(best)
  }

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${n} sessions logged`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yAt(v)} y2={yAt(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.l - 8} y={yAt(v) + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)" fontWeight={600}>{v}</text>
          </g>
        ))}
        {target && (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={yAt(target.target)} y2={yAt(target.target)} stroke="var(--ink-2)" strokeWidth={1.5} strokeDasharray="5 5" />
            <text x={PAD.l + 4} y={yAt(target.target) - 6} textAnchor="start" fontSize={11.5} fontWeight={700} fill="var(--ink-2)">
              {target.level} target · {target.target}
            </text>
          </g>
        )}
        {n > 1 && (
          <path d={pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('')} fill="none" stroke="var(--court)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {pts.map(([x, y], i) => (
          <circle key={series[i].id ?? i} cx={x} cy={y} r={i === n - 1 || i === hover ? 5.5 : 4} fill="var(--court)" stroke="var(--surface)" strokeWidth={2} />
        ))}
        {n > 0 && (
          <text x={pts[n - 1][0]} y={pts[n - 1][1] - 11} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="var(--ink)">
            {series[n - 1].score}
          </text>
        )}
        {n > 0 && (
          <g fontSize={11} fill="var(--ink-3)" fontWeight={600}>
            <text x={PAD.l} y={H - 8}>{fmtDate(series[0].at)}</text>
            {n > 1 && <text x={W - PAD.r} y={H - 8} textAnchor="end">{fmtDate(series[n - 1].at)}</text>}
          </g>
        )}
        {hover !== null && n > 0 && (
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1={PAD.t} y2={PAD.t + ih} stroke="var(--ink-3)" strokeWidth={1} />
        )}
        <rect x={0} y={0} width={W} height={H} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {n === 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, display: 'grid', placeItems: 'center' }}>
          <p className="faint">No scores yet. Your first one sets the baseline.</p>
        </div>
      )}
      {hover !== null && n > 0 && (
        <div className="chart-tip" style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100}%` }}>
          {series[hover].score} · {fmtDate(series[hover].at)}
        </div>
      )}
    </div>
  )
}
