// Status is a word + a shape + a pattern + a colour, never colour alone.
// The verdict itself comes from the backend (backend/health.py); this only draws it.

export const WORD = { danger: 'DANGER', check: 'CHECK', ok: 'OK', no_signal: 'NO SIGNAL' }
export const RANK = { danger: 0, check: 1, no_signal: 2, ok: 3 }

const ICON = {
  danger: <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" opacity=".25" /><rect x="4" y="8.5" width="12" height="3" fill="currentColor" /></svg>,
  check: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 19 18H1Z" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="9" y="7" width="2" height="6" fill="currentColor" /><rect x="9" y="14.5" width="2" height="2" fill="currentColor" /></svg>,
  ok: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5 8 14.5 16 5.5" fill="none" stroke="currentColor" strokeWidth="2.6" /></svg>,
  no_signal: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3 17 17M17 3 3 17" stroke="currentColor" strokeWidth="2.4" /></svg>,
}

export function StatusChip({ status = 'no_signal', label, size = 'md', className = '' }) {
  return (
    <span className={`chip chip--${status} chip--${size} ${className}`}>
      {ICON[status]}
      <span>{label ?? WORD[status]}</span>
    </span>
  )
}

export function fmt(v, unit = '') {
  if (v == null) return '—'
  const n = Math.abs(v) < 10 ? +v.toFixed(2) : +v.toFixed(1)
  return `${n}${unit ? ` ${unit}` : ''}`
}

export function limitText(s) {
  if (s.max != null && s.min != null) return `${fmt(s.min)}–${fmt(s.max)} ${s.unit}`
  if (s.max != null) return `max ${fmt(s.max, s.unit)}`
  if (s.min != null) return `min ${fmt(s.min, s.unit)}`
  return 'no limit set'
}
