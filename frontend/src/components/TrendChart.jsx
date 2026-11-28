// One sensor over time: the limit drawn as a dashed line, and the moment the
// current breach started marked, so "since when?" never needs a second look.
const W = 520, H = 190, L = 40, R = 510, T = 32, B = 170
const INK = { danger: '#C8281E', check: '#9A6B00', ok: '#1B2F5E', no_signal: '#7A8591' }

export default function TrendChart({ points, min, max, unit, status, sinceMs }) {
  if (points.length < 2) return <p className="p chart__empty">Not enough recent readings to draw a trend.</p>

  const vals = points.map((p) => p.v)
  const lims = [min, max].filter((v) => v != null)
  let lo = Math.min(...vals, ...lims), hi = Math.max(...vals, ...lims)
  // keep the limit well inside the plot so a breach reads as a level above a line, not as noise
  const room = Math.max((hi - lo) * 0.25, Math.abs(lims[0] ?? hi) * 0.08, 1)
  const pad = (hi - lo || 1) * 0.12
  lo = Math.min(lo - pad, ...lims.map((v) => v - room)); hi = Math.max(hi + pad, ...lims.map((v) => v + room * 0.4))
  const t0 = points[0].t, t1 = points.at(-1).t
  const X = (t) => L + ((t - t0) / (t1 - t0 || 1)) * (R - L)
  const Y = (v) => B - ((v - lo) / (hi - lo)) * (B - T)
  const out = (v) => (max != null && v > max) || (min != null && v < min)

  // onset = the backend's breach start (same clock as the headline and trend box); fall back to the series
  let onsetT = null
  if (sinceMs && (status === 'danger' || status === 'check')) onsetT = Math.max(sinceMs, t0)
  else if (out(vals.at(-1))) {
    let i = points.length - 1
    while (i > 0 && out(vals[i - 1])) i--
    onsetT = points[i].t
  }
  const onset = onsetT != null ? 0 : null
  const col = INK[status] ?? INK.ok
  const mins = Math.floor((Date.now() - (sinceMs ?? onsetT ?? t1)) / 60000)
  const span = Math.round((t1 - t0) / 60000)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Trend${onset != null ? `, outside the limit for ${mins} min` : ''}`}>
      {onset != null && (
        <g>
          <rect x={X(onsetT)} y={T} width={R - X(onsetT)} height={B - T} fill={col} opacity=".07" />
          <line x1={X(onsetT)} x2={X(onsetT)} y1={T} y2={B} stroke={col} strokeWidth="1.5" />
          <text x={R} y={14} textAnchor="end" fontSize="12" fontWeight="700" fill={col}>{mins < 1 ? 'outside the limit for under a minute' : `outside the limit for ${mins} min`}</text>
        </g>
      )}
      {lims.map((v) => (
        <g key={v}>
          <line x1={L} x2={R} y1={Y(v)} y2={Y(v)} stroke="#C8281E" strokeWidth="1.5" strokeDasharray="6 4" />
          {v === lims[0] && <text x={L} y={14} fontSize="12" fontWeight="700" fill="#C8281E">– – limit {lims.join(' / ')} {unit}</text>}
        </g>
      ))}
      <polyline points={points.map((p) => `${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ')} fill="none" stroke={col} strokeWidth="2.5" strokeLinejoin="round" />
      <line x1={L} x2={R} y1={B} y2={B} stroke="#C6CFDB" />
      <text x={L - 6} y={Y(hi - pad) + 4} textAnchor="end" fontSize="11" fill="#55627A">{+(hi - pad).toFixed(1)}</text>
      <text x={L - 6} y={Y(lo + pad) + 4} textAnchor="end" fontSize="11" fill="#55627A">{+(lo + pad).toFixed(1)}</text>
      <text x={L} y={H - 2} fontSize="11" fill="#55627A">−{span} min</text>
      <text x={R} y={H - 2} textAnchor="end" fontSize="11" fill="#55627A">now</text>
    </svg>
  )
}
