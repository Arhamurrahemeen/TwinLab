import { useMemo, useState } from 'react'
import { getFleet, getFeed, discoverDevices } from '../api'
import { usePoll } from '../hooks/usePoll'
import { StatusChip, WORD, limitText } from '../status'
import { openMachine } from '../nav'
import Twin from '../twin/Twin'
import TopBar from '../components/TopBar'
import RegisterDevice from '../components/RegisterDevice'

const plantOf = (d) => d.plant || d.location || 'Unassigned'

function ago(iso) {
  // Mongo hands back naive UTC datetimes; without a zone JS would read them as local time
  const t = new Date(/Z|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`)
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  if (m < 1440) return `${Math.floor(m / 60)} h ago`
  return t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const FEED_STATUS = { critical: 'danger', warning: 'check' }

export function sinceText(ms) {
  const m = Math.floor((Date.now() - ms) / 60000)
  return m < 1 ? 'under a minute' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`
}

// An alert belongs in "Needs attention" only while its condition is still true:
// the sensor is still out of limits, or a consumable came due in the last 24 h.
function stillActive(a, byId) {
  if (a.alert_type === 'consumable_reorder') return Date.now() - new Date(/Z|[+-]\d\d:\d\d$/.test(a.created_at) ? a.created_at : `${a.created_at}Z`) < 86_400_000
  const s = byId[a.device_id]?.health.sensors.find((x) => x.sensor === a.sensor)
  return !!s && (s.status === 'danger' || s.status === 'check')
}

function Tile({ d, big, rows }) {
  const h = d.health
  return (
    <button className={`t ${big ? 't--big' : ''} ${h.status === 'no_signal' ? 't--grey' : ''}`} onClick={() => openMachine(d.device_id)}>
      <span className={`tag ${d.source === 'hardware' ? 'tag--real' : ''}`}>{d.source === 'hardware' ? 'REAL SENSOR' : 'SIMULATED'}</span>
      <h3>{d.name}</h3>
      <span className="p">{plantOf(d)}{big && d.asset_type ? ` · ${d.asset_type.replace(/_/g, ' ')}` : ''}</span>
      <Twin device={d} spin="hover" className="t__twin" />
      {big && <span className="hint">Open to rotate the twin and inspect each part</span>}
      <StatusChip status={h.status} size={big ? 'xl' : 'md'} />
      <span className="r">
        {h.headline}
        {big && h.trend?.name && <small>{h.trend.title}</small>}
        {big && h.sensors[0]?.since_ms && <small>{limitText(h.sensors[0])} · for {sinceText(h.sensors[0].since_ms)}</small>}
      </span>
    </button>
  )
}

export default function Fleet() {
  const { data: fleet, error } = usePoll(getFleet, 3000)
  const { data: feed } = usePoll(() => getFeed(12), 5000)
  const { data: unregistered } = usePoll(discoverDevices, 15000)
  const [plant, setPlant] = useState(null)
  const [adding, setAdding] = useState(false)

  const plants = useMemo(() => {
    const m = new Map()
    for (const d of fleet ?? []) m.set(plantOf(d), (m.get(plantOf(d)) ?? 0) + 1)
    return [...m]
  }, [fleet])
  const shown = (fleet ?? []).filter((d) => !plant || plantOf(d) === plant)
  const lead = shown.length > 0 && shown[0].health.status !== 'ok'
  // rows the small tiles (+ the Add tile) fill in two columns; the lead tile and feed span them all
  const rows = Math.max(2, Math.ceil((shown.length - (lead ? 1 : 0) + 1) / 2))
  // latest alert per machine + sensor + kind: the feed lists what needs attention, not every repeat
  const attention = useMemo(() => {
    const seen = new Set()
    const byId = Object.fromEntries((fleet ?? []).map((d) => [d.device_id, d]))
    return (feed ?? []).filter((a) => stillActive(a, byId)).filter((a) => {
      const k = `${a.device_id}|${a.sensor}|${a.alert_type}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    }).slice(0, 8)
  }, [feed, fleet])
  const names = Object.fromEntries((fleet ?? []).map((d) => [d.device_id, d.name]))

  return (
    <div className="screen">
      <TopBar live={!error} actions={<a className="btn-o" href="#/floor">Floor view (TV)</a>}>
        <nav className="tabs" aria-label="Plants">
          <button className="tab" aria-pressed={!plant} onClick={() => setPlant(null)}>All plants · {fleet?.length ?? 0}</button>
          {plants.map(([p, n]) => (
            <button key={p} className="tab" aria-pressed={plant === p} onClick={() => setPlant(p)}>{p} · {n}</button>
          ))}
        </nav>
      </TopBar>

      <div className="rib" role="list" aria-label="Every machine, worst first">
        {shown.map((d) => (
          <button key={d.device_id} role="listitem" className="rc" onClick={() => openMachine(d.device_id)} aria-label={`${d.name}: ${WORD[d.health.status]}`}>
            <StatusChip status={d.health.status} size="lg" />
            <span className="rc__n">{d.name}</span>
          </button>
        ))}
      </div>

      {error && !fleet && <p className="empty">Can’t reach the TwinLab backend. Check that it is running on port 8000.</p>}
      {fleet && shown.length === 0 && <p className="empty">No machines registered yet. Add one to see its twin here.</p>}

      <div className="fleet" style={{ '--rows': rows }}>
        {shown.map((d, i) => <Tile key={d.device_id} d={d} big={i === 0 && lead} rows={rows} />)}
        <button className="t t--add" onClick={() => setAdding(true)}>
          <b>+ Add machine</b>
          <span className="p">{unregistered?.length ? `${unregistered.length} sensor${unregistered.length > 1 ? 's' : ''} found, not registered yet` : 'Register a sensor node'}</span>
        </button>
        <aside className="feed">
          <h2>Needs attention</h2>
          {attention.length === 0 && <p className="p">Nothing needs attention right now.</p>}
          {attention.map((a, i) => (
            <button key={i} className="al" onClick={() => openMachine(a.device_id)}>
              <StatusChip status={a.alert_type === 'consumable_reorder' ? 'ok' : FEED_STATUS[a.severity] ?? 'check'} label={a.alert_type === 'consumable_reorder' ? 'DUE' : a.alert_type === 'fuel_theft' ? 'THEFT' : undefined} size="sm" />
              <b>{names[a.device_id] ?? a.device_id}</b>
              <span className="al__d">{a.alert_type === 'consumable_reorder' ? `${Math.round(a.value)} h reached · reorder consumables` : `${(a.sensor ?? '').replace(/_/g, ' ')} ${a.value} ${a.unit}, ${a.detail}`} · {ago(a.created_at)}</span>
            </button>
          ))}
        </aside>
      </div>

      {adding && <RegisterDevice onCreated={() => setAdding(false)} onClose={() => setAdding(false)} />}
    </div>
  )
}
