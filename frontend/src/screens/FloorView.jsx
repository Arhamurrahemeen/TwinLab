import { getFleet } from '../api'
import { usePoll } from '../hooks/usePoll'
import { StatusChip, WORD } from '../status'
import Twin from '../twin/Twin'
import { Clock } from '../components/TopBar'

// Wall TV in the control room: read from 3–5 m, nobody touches it.
export default function FloorView() {
  const { data: fleet, error } = usePoll(getFleet, 3000)
  const list = fleet ?? []
  const count = (s) => list.filter((d) => d.health.status === s).length

  return (
    <div className="tv">
      <header className="tv__hdr">
        <a className="wm" href="#/">Twin<b>Lab</b></a>
        <span className="tv__sub">{error ? 'Connection lost · showing last known' : `All plants · ${list.length} machines`}</span>
        <span className="tv__clock"><Clock /></span>
      </header>
      <div className="tv__sum">
        {['danger', 'check', 'no_signal', 'ok'].map((s) => <StatusChip key={s} status={s} label={`${count(s)} ${WORD[s]}`} size="tv" className={count(s) === 0 ? 'chip--zero' : ''} />)}
      </div>
      <div className="tv__grid" style={{ '--cols': list.length <= 3 ? list.length || 1 : list.length === 4 ? 2 : 3 }}>
        {list.map((d) => (
          <div key={d.device_id} className={`tvt ${d.health.status === 'no_signal' ? 't--grey' : ''}`}>
            <h3>{d.name}</h3>
            <span className="p">{d.plant || d.location}</span>
            <Twin device={d} spin="always" zoom={2} className="tvt__twin" />
            <StatusChip status={d.health.status} size="tv" />
            <span className="r">{d.health.headline}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
