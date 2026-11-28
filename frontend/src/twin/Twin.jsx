import { useEffect, useRef } from 'react'
import { mountTwin } from './stage'
import { kindFor, partFor } from './models'

/**
 * A live 3D twin of one machine.
 * device: a /fleet or /devices/{id}/health row ({asset_type, health})
 */
export default function Twin({ device, zoom = 1, orbit = false, spin = 'hover', selected = null, onPick, pinsRef, className = '', twinRef }) {
  const el = useRef(null)
  const handle = useRef(null)
  const kind = kindFor(device.asset_type)

  useEffect(() => {
    handle.current = mountTwin(el.current, { kind, orbit, spin, zoom, onPick, pinsEl: pinsRef?.current })
    if (twinRef) twinRef.current = handle.current
    return () => handle.current.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, orbit])

  const h = device.health
  useEffect(() => {
    const glow = {}
    for (const s of h?.sensors ?? []) {
      const part = partFor(kind, s.sensor)
      if (part && (s.status === 'danger' || (s.status === 'check' && glow[part] !== 'danger'))) glow[part] = s.status
    }
    handle.current?.set({ status: h?.status ?? 'no_signal', running: !!h?.running, glow, selected })
  }, [h, kind, selected])

  return <div ref={el} className={`twin ${orbit ? 'twin--orbit' : ''} ${className}`} />
}
