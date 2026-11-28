import { useEffect, useState } from 'react'

export function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])
  const day = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')
  return `${day} · ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export default function TopBar({ live = true, children, actions }) {
  return (
    <header className="top">
      <a className="wm" href="#/" aria-label="TwinLab home">Twin<b>Lab</b></a>
      {children}
      <span className="sp" />
      <span className={`live ${live ? '' : 'live--off'}`}>
        <i aria-hidden="true" />
        <span>{live ? <Clock /> : 'Offline'}</span>
      </span>
      {actions}
    </header>
  )
}
