import { useEffect, useMemo, useRef, useState } from 'react'
import { getHealth, getReadings, deleteDevice } from '../api'
import { usePoll } from '../hooks/usePoll'
import { useDeviceSocket } from '../hooks/useDeviceSocket'
import { StatusChip, fmt, limitText } from '../status'
import { sinceText } from './Fleet'
import Twin from '../twin/Twin'
import { kindFor, partFor } from '../twin/models'
import TopBar from '../components/TopBar'
import EditDevice from '../components/EditDevice'
import TrendChart from '../components/TrendChart'

const cap = (s) => s[0].toUpperCase() + s.slice(1)

export default function MachineDetail({ id }) {
  const { data: d, error, reload } = usePoll(() => getHealth(id), 3000, [id])
  const { messages, connected } = useDeviceSocket(id)
  const [picked, setPicked] = useState(null)
  const [editing, setEditing] = useState(false)
  const pinsRef = useRef(null)
  const twinRef = useRef(null)

  // a fresh alert on the socket → refresh the verdict now, not in 3 s
  const alertCount = messages.filter((m) => m.type === 'alert').length
  useEffect(() => { if (alertCount) reload() }, [alertCount, reload])

  const h = d?.health
  const kind = kindFor(d?.asset_type)
  const sensorName = picked ?? h?.sensors?.[0]?.sensor
  const sensor = h?.sensors?.find((s) => s.sensor === sensorName)

  const byPart = useMemo(() => {
    const m = new Map()
    for (const s of h?.sensors ?? []) {
      const p = partFor(kind, s.sensor)
      if (p) m.set(p, [...(m.get(p) ?? []), s])
    }
    return m
  }, [h, kind])

  const pickPart = (part) => {
    const s = byPart.get(part)?.[0]
    if (s) setPicked(s.sensor)
  }

  if (error && !d) {
    return (
      <div className="screen">
        <TopBar live={false} />
        <p className="empty">Can’t load this machine. <a href="#/">Back to all machines</a></p>
      </div>
    )
  }
  if (!d) return <div className="screen"><TopBar /><p className="empty">Loading machine…</p></div>

  const remove = async () => {
    if (!window.confirm(`Delete ${d.name}? Its readings stay in InfluxDB, but it disappears from TwinLab.`)) return
    await deleteDevice(d.device_id)
    location.hash = '#/'
  }

  return (
    <div className="screen">
      <TopBar live={connected || !error} />
      <nav className="crumb" aria-label="Breadcrumb"><a href="#/">All machines</a><span aria-hidden="true">/</span><span>{d.name}</span></nav>
      <div className="detail">
        <section className="stage" aria-label={`3D twin of ${d.name}`}>
          <div className="stage__meta">
            <h1>{d.name}</h1>
            <p className="p">{[d.plant || d.location, d.asset_type?.replace(/_/g, ' '), d.source === 'hardware' ? 'real sensor' : 'simulated'].filter(Boolean).join(' · ')}</p>
          </div>
          <Twin device={d} orbit selected={partFor(kind, sensorName)} onPick={pickPart} pinsRef={pinsRef} twinRef={twinRef} className="stage__twin" />
          <div className="pins" ref={pinsRef}>
            {[...byPart].map(([part, ss]) => (
              <div key={part} data-pin={part} className={`pin pin--${ss[0].status} ${partFor(kind, sensorName) === part ? 'pin--sel' : ''}`}>
                <button onClick={() => pickPart(part)} aria-label={`${cap(part)}: ${ss.map((s) => `${s.label} ${fmt(s.value, s.unit)}`).join(', ')}`}>
                  <i aria-hidden="true" />{cap(part)} · {fmt(ss[0].value, ss[0].unit)}
                </button>
              </div>
            ))}
          </div>
          <p className="hint stage__hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" /><path d="M18 3v4h-4M6 21v-4h4" /></svg>
            Drag to rotate · scroll to zoom · tap a part to see its sensor
          </p>
          <button className="btn-s stage__reset" onClick={() => twinRef.current?.resetCamera()}>Reset view</button>
        </section>

        <aside className="side">
          <StatusChip status={h.status} size="xxl" />
          <p className="head-read">{h.headline}{h.status === 'no_signal' ? null : sensor && <small>{limitText(sensor)}{sensor.since_ms ? ` · outside the limit for ${sinceText(sensor.since_ms)}` : ''}</small>}</p>

          <section className={`trend trend--${h.status}`} aria-label="Fault trend">
            <b>{h.trend.title}</b>
            <p>{h.trend.text}</p>
            {h.trend.checks.length > 0 && (
              <>
                <small>CHECK FIRST</small>
                <ul>{h.trend.checks.map((c) => <li key={c}>{c}</li>)}</ul>
              </>
            )}
          </section>

          {sensor && <SensorHistory deviceId={id} sensor={sensor} live={messages} />}

          <table className="sens">
            <thead><tr><th>Sensor</th><th>Now</th><th>Limit</th><th>Status</th></tr></thead>
            <tbody>
              {h.sensors.map((s) => (
                <tr key={s.sensor} className={s.sensor === sensorName ? 'sel' : ''} onClick={() => setPicked(s.sensor)}>
                  <td><button className="rowbtn" onClick={() => setPicked(s.sensor)}>{s.label}</button></td>
                  <td>{fmt(s.value, s.unit)}</td>
                  <td>{limitText(s)}</td>
                  <td><StatusChip status={s.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="acts">
            <button className="btn" onClick={() => setEditing(true)}>Edit machine and limits</button>
            <span className="sp" />
            <button className="btn-danger" onClick={remove}>Delete machine</button>
          </div>
        </aside>
      </div>
      {editing && <EditDevice device={d} onUpdated={() => { setEditing(false); reload() }} onClose={() => setEditing(false)} />}
    </div>
  )
}

function SensorHistory({ deviceId, sensor, live }) {
  const { data } = usePoll(() => getReadings(deviceId, sensor.sensor, 300, 1), 10000, [deviceId, sensor.sensor])
  const points = useMemo(() => {
    const hist = (data ?? []).map((p) => ({ t: new Date(p.ts).getTime(), v: p.value }))
    const last = hist.at(-1)?.t ?? 0
    const fresh = live.filter((m) => m.sensor === sensor.sensor && m.type !== 'alert' && m.ts > last).map((m) => ({ t: m.ts, v: m.value }))
    return [...hist, ...fresh].slice(-160)
  }, [data, live, sensor.sensor])
  return (
    <section className="chart" aria-label={`${sensor.label}, recent readings`}>
      <h4><span>{sensor.label} · {fmt(sensor.value, sensor.unit)}</span><span className="p">recent readings</span></h4>
      <TrendChart points={points} min={sensor.min} max={sensor.max} unit={sensor.unit} status={sensor.status} sinceMs={sensor.since_ms} />
    </section>
  )
}
