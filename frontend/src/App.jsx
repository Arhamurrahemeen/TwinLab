import { useEffect, useState } from 'react'
import Fleet from './screens/Fleet'
import MachineDetail from './screens/MachineDetail'
import FloorView from './screens/FloorView'
import ChatPanel from './components/ChatPanel'
import './App.css'

// Hash routes keep the browser Back button working with no router dependency:
//   #/            fleet     #/machine/<id>   detail     #/floor   TV floor view
function parse() {
  const h = location.hash.replace(/^#\/?/, '')
  const [screen, id] = h.split('/')
  if (screen === 'machine' && id) return { screen: 'detail', id: decodeURIComponent(id) }
  if (screen === 'floor') return { screen: 'floor' }
  return { screen: 'fleet' }
}



export default function App() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0) }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])

  return (
    <>
      {route.screen === 'fleet' && <Fleet />}
      {route.screen === 'detail' && <MachineDetail id={route.id} key={route.id} />}
      {route.screen === 'floor' && <FloorView />}
      {route.screen !== 'floor' && <ChatPanel device={route.screen === 'detail' ? { device_id: route.id } : null} />}
    </>
  )
}
