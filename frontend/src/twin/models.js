// Procedural 3D machines. Source of truth for the .glb files that both the web
// dashboard and the Android app load (`npm run models` writes them).
//
// Naming contract (read by web + Android):
//   part_<name>  meshes belonging to a sensor-bearing part; each part has its own
//                materials so one part can glow without the rest
//   pin_<name>   empty node where a part's label pin sits
//   spin_<name>  node rotated by the "run" animation clip (played while running)
import * as THREE from 'three'

export const KINDS = ['genset', 'compressor', 'pump']

// asset_type from the device registry → model. Everything else is a motor/pump.
export function kindFor(assetType) {
  if (assetType === 'genset' || assetType === 'generator') return 'genset'
  if (assetType === 'compressor') return 'compressor'
  return 'pump'
}

const PAINT = { genset: 0xd9a441, compressor: 0x4f7fb0, pump: 0x3f8a70 }

function factory(kind) {
  const cache = new Map()
  const mat = (part, color, o = {}) => {
    const key = `${part}:${color}:${o.r ?? ''}:${o.m ?? ''}`
    if (!cache.has(key)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.55, metalness: o.m ?? 0.15 })
      m.name = `${part}_${cache.size}`
      cache.set(key, m)
    }
    return cache.get(key)
  }
  return {
    paint: (p) => mat(p, PAINT[kind]),
    steel: (p) => mat(p, 0xb8c2cc, { r: 0.35, m: 0.6 }),
    dark: (p) => mat(p, 0x2e3946, { r: 0.7 }),
    black: (p) => mat(p, 0x161b22, { r: 0.8 }),
    tone: (p, c, o) => mat(p, c, o),
  }
}

const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
const cyl = (r, h, m, seg = 32) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m)
const ring = (r, t, m) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 40), m)

function spinClip(name, axis, revPerSec) {
  // 5 keys per turn so slerp never takes the short way round.
  const dur = 1 / revPerSec
  const times = [0, 0.25, 0.5, 0.75, 1].map((f) => f * dur)
  const ax = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0)
  const values = []
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const q = new THREE.Quaternion().setFromAxisAngle(ax, f * Math.PI * 2)
    values.push(q.x, q.y, q.z, q.w)
  }
  return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, values)
}

/** Returns { scene: THREE.Group, clip: THREE.AnimationClip } */
export function buildModel(kind) {
  const g = new THREE.Group()
  g.name = kind
  const M = factory(kind)
  const tracks = []
  const add = (mesh, part, x, y, z, parent = g) => {
    mesh.position.set(x, y, z)
    mesh.name = part ? `part_${part}` : 'frame'
    parent.add(mesh)
    return mesh
  }
  const pin = (part, x, y, z) => {
    const o = new THREE.Object3D()
    o.name = `pin_${part}`
    o.position.set(x, y, z)
    g.add(o)
  }
  const spinner = (name, axis, rps, x, y, z) => {
    const s = new THREE.Group()
    s.name = `spin_${name}`
    s.position.set(x, y, z)
    g.add(s)
    tracks.push(spinClip(s.name, axis, rps))
    return s
  }

  if (kind === 'genset') {
    add(box(2.5, 0.28, 1.05, M.dark('tank')), 'tank', 0, 0.14, 0)
    add(box(2.2, 1.05, 0.92, M.paint('engine')), 'engine', -0.05, 0.8, 0)
    for (let i = 0; i < 6; i++) add(box(0.1, 0.55, 0.02, M.tone('engine', 0xb98a34)), 'engine', -0.85 + i * 0.22, 0.82, 0.47)
    add(box(0.7, 0.05, 0.5, M.steel('engine')), 'engine', -0.35, 1.35, 0)
    add(box(0.08, 0.9, 0.84, M.black('radiator')), 'radiator', 1.1, 0.79, 0)
    const guard = ring(0.4, 0.025, M.steel('radiator'))
    guard.rotation.y = Math.PI / 2
    add(guard, 'radiator', 1.17, 0.79, 0)
    const fan = spinner('fan', 'x', 2.2, 1.16, 0.79, 0)
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Group()
      p.rotation.x = (i * Math.PI * 2) / 5
      const b = box(0.02, 0.34, 0.09, M.steel('radiator'))
      b.position.y = 0.17
      b.name = 'part_radiator'
      p.add(b)
      fan.add(p)
    }
    add(box(0.5, 0.36, 0.04, M.dark('alternator')), 'alternator', -0.7, 0.82, -0.47)
    add(cyl(0.07, 0.5, M.steel('exhaust')), 'exhaust', 0.5, 1.55, -0.2)
    pin('engine', 0.2, 1.4, 0.45); pin('radiator', 1.15, 1.3, 0); pin('tank', 0.4, 0.3, 0.52)
    pin('alternator', -1.15, 0.75, -0.1); pin('exhaust', 0.5, 1.85, -0.2)
  } else if (kind === 'compressor') {
    add(box(2.3, 0.14, 0.95, M.dark('frame')), null, 0, 0.07, 0)
    const tank = cyl(0.42, 1.95, M.paint('tank'))
    tank.rotation.z = Math.PI / 2
    add(tank, 'tank', 0, 0.6, 0)
    for (const x of [-0.98, 0.98]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.paint('tank'))
      cap.rotation.z = x < 0 ? Math.PI / 2 : -Math.PI / 2
      add(cap, 'tank', x, 0.6, 0)
    }
    add(box(0.36, 0.14, 0.6, M.dark('frame')), null, -0.6, 0.14, 0)
    add(box(0.36, 0.14, 0.6, M.dark('frame')), null, 0.6, 0.14, 0)
    const mot = cyl(0.22, 0.6, M.steel('motor'))
    mot.rotation.z = Math.PI / 2
    add(mot, 'motor', -0.35, 1.25, 0.1)
    add(box(0.45, 0.4, 0.4, M.tone('head', 0x8d99a6, { r: 0.4, m: 0.5 })), 'head', 0.35, 1.22, 0.1)
    for (let i = 0; i < 4; i++) add(box(0.5, 0.03, 0.46, M.steel('head')), 'head', 0.35, 1.08 + i * 0.1, 0.1)
    const pul = spinner('pulley', 'z', 1.6, -0.35, 1.25, 0.4)
    const wheel = cyl(0.2, 0.06, M.black('motor'))
    wheel.rotation.x = Math.PI / 2
    wheel.name = 'part_motor'
    pul.add(wheel)
    const mark = box(0.05, 0.18, 0.07, M.steel('motor'))
    mark.position.y = 0.1
    mark.name = 'part_motor'
    pul.add(mark)
    const gauge = cyl(0.09, 0.05, M.tone('gauge', 0xffffff))
    gauge.rotation.x = Math.PI / 2
    add(gauge, 'gauge', 0.85, 0.95, 0.38)
    pin('tank', 0.6, 1.0, 0.3); pin('motor', -0.35, 1.55, 0.1); pin('head', 0.35, 1.55, 0.1); pin('gauge', 0.85, 1.1, 0.4)
  } else {
    add(box(2.0, 0.12, 0.9, M.dark('frame')), null, 0, 0.06, 0)
    const mot = cyl(0.36, 1.05, M.paint('motor'))
    mot.rotation.z = Math.PI / 2
    add(mot, 'motor', -0.45, 0.55, 0)
    for (let i = 0; i < 7; i++) {
      const f = ring(0.37, 0.025, M.paint('motor'))
      f.rotation.y = Math.PI / 2
      add(f, 'motor', -0.9 + i * 0.13, 0.55, 0)
    }
    const cowl = cyl(0.33, 0.15, M.dark('motor'))
    cowl.rotation.z = Math.PI / 2
    add(cowl, 'motor', -1.03, 0.55, 0)
    add(box(0.9, 0.1, 0.6, M.dark('frame')), null, -0.45, 0.17, 0)
    const cp = spinner('coupling', 'x', 2.5, 0.22, 0.55, 0)
    const c = cyl(0.12, 0.2, M.steel('coupling'))
    c.rotation.z = Math.PI / 2
    c.name = 'part_coupling'
    cp.add(c)
    const key = box(0.2, 0.04, 0.25, M.tone('coupling', 0xe8a317))
    key.name = 'part_coupling'
    cp.add(key)
    const vol = cyl(0.4, 0.34, M.steel('pump'))
    vol.rotation.z = Math.PI / 2
    add(vol, 'pump', 0.6, 0.55, 0)
    add(cyl(0.11, 0.5, M.steel('pump')), 'pump', 0.6, 1.0, 0)
    const inl = cyl(0.11, 0.4, M.steel('pump'))
    inl.rotation.z = Math.PI / 2
    add(inl, 'pump', 0.95, 0.55, 0)
    pin('motor', -0.45, 0.95, 0); pin('pump', 0.6, 1.3, 0); pin('coupling', 0.22, 0.75, 0)
  }
  return { scene: g, clip: new THREE.AnimationClip('run', -1, tracks) }
}

// Which model part carries each sensor, per machine kind. Shared with Android
// (android/.../domain/TwinParts.kt mirrors this table).
export const SENSOR_PART = {
  genset: { temperature: 'engine', vibration: 'engine', humidity: 'engine', fuel_level: 'tank', load_current: 'alternator' },
  compressor: { temperature: 'head', vibration: 'head', humidity: 'motor', load_current: 'motor' },
  pump: { temperature: 'motor', vibration: 'motor', humidity: 'motor', load_current: 'motor' },
}
export const partFor = (kind, sensor) => SENSOR_PART[kind]?.[sensor] ?? null
