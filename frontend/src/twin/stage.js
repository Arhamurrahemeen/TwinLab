// One WebGL canvas for every twin on the page, scissored into each view's
// rectangle. Browsers cap live WebGL contexts (~16); a fleet can't spend one
// per machine.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const GLOW = { danger: 0xc8281e, check: 0xe8a317 }
const SELECT = 0x3d7bd9
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

let renderer, envTex, canvas
const views = new Set()
if (import.meta.env.DEV) window.__twinViews = views   // dev-only handle for debugging twins in the console
const loader = new GLTFLoader()
const gltfCache = new Map()
const clock = new THREE.Clock()
const tmp = new THREE.Vector3()
const TINT = new THREE.Color()

function ensureRenderer() {
  if (renderer) return
  canvas = document.createElement('canvas')
  canvas.className = 'twin-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  const pmrem = new THREE.PMREMGenerator(renderer)
  envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  requestAnimationFrame(frame)
}

function loadKind(kind) {
  if (!gltfCache.has(kind)) gltfCache.set(kind, loader.loadAsync(`/models/${kind}.glb`))
  return gltfCache.get(kind)
}

function shadowPlane() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64)
  gr.addColorStop(0, 'rgba(11,26,51,.35)')
  gr.addColorStop(1, 'rgba(11,26,51,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 128, 128)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }))
  m.rotation.x = -Math.PI / 2
  m.position.y = 0.002
  return m
}

/**
 * Mount a twin into `el`.
 * opts: { kind, zoom?: number, orbit?: bool, spin?: 'never'|'hover'|'always', pinsEl?: HTMLElement, onPick?: (part) => void }
 * Returns { set(state), resetCamera(), dispose() }
 * state: { status, running, glow: {part: 'danger'|'check'}, selected: part|null }
 */
export function mountTwin(el, opts) {
  ensureRenderer()
  const scene = new THREE.Scene()
  scene.environment = envTex
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.6))
  const dl = new THREE.DirectionalLight(0xffffff, 1.6)
  dl.position.set(3, 5, 4)
  scene.add(dl)
  scene.add(shadowPlane())
  const cam = new THREE.PerspectiveCamera(opts.orbit ? 30 : 28, 1, 0.1, 50)
  const home = new THREE.Vector3(...(opts.orbit ? [4.6, 3.0, 5.4] : [4.2, 3.0, 5.0]))
  cam.position.copy(home)
  cam.lookAt(0, 0.6, 0)

  const v = {
    el, opts, scene, cam, home, root: null, mixer: null, action: null, parts: new Map(), pins: new Map(),
    greyed: false, yaw: 0, hover: false, state: { status: 'ok', running: false, glow: {}, selected: null },
    controls: null, disposed: false,
  }
  if (opts.orbit) {
    v.controls = new OrbitControls(cam, el)
    v.controls.target.set(0, 0.6, 0)
    v.controls.enableDamping = true
    v.controls.minDistance = 3.2
    v.controls.maxDistance = 10
    v.controls.maxPolarAngle = Math.PI * 0.49
    v.controls.update()
  }
  const enter = () => (v.hover = true)
  const leave = () => (v.hover = false)
  el.addEventListener('pointerenter', enter)
  el.addEventListener('pointerleave', leave)

  // click (not drag) on a part → onPick
  let down = null
  const ray = new THREE.Raycaster()
  const pd = (e) => (down = [e.clientX, e.clientY])
  const pu = (e) => {
    if (!opts.onPick || !v.root || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return
    const r = el.getBoundingClientRect()
    ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, cam)
    const hit = ray.intersectObject(v.root, true).find((h) => h.object.name.startsWith('part_'))
    if (hit) opts.onPick(hit.object.name.slice(5).replace(/_\d+$/, ''))
  }
  el.addEventListener('pointerdown', pd)
  el.addEventListener('pointerup', pu)

  loadKind(opts.kind).then((gltf) => {
    if (v.disposed) return
    const root = gltf.scene.clone(true)
    const clones = new Map()
    root.traverse((o) => {
      if (o.isMesh) {
        if (!clones.has(o.material.uuid)) {
          const m = o.material.clone()
          m.userData.base = m.color.clone()
          clones.set(o.material.uuid, m)
        }
        o.material = clones.get(o.material.uuid)
        if (o.name.startsWith('part_')) {
          // GLTFLoader makes duplicate node names unique (part_engine_1, _2…); strip that back off
          const p = o.name.slice(5).replace(/_\d+$/, '')
          if (!v.parts.has(p)) v.parts.set(p, new Set())
          v.parts.get(p).add(o.material)
        }
      }
      if (o.name.startsWith('pin_')) v.pins.set(o.name.slice(4).replace(/_\d+$/, ''), o)
    })
    v.materials = [...clones.values()]
    v.root = root
    scene.add(root)
    if (gltf.animations[0]) {
      v.mixer = new THREE.AnimationMixer(root)
      v.action = v.mixer.clipAction(gltf.animations[0])
      v.action.play()
    }
  })

  views.add(v)
  return {
    set(state) { v.state = { ...v.state, ...state } },
    resetCamera() { cam.position.copy(home); v.controls?.target.set(0, 0.6, 0) },
    dispose() {
      v.disposed = true
      views.delete(v)
      v.controls?.dispose()
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerdown', pd)
      el.removeEventListener('pointerup', pu)
    },
  }
}

function applyLook(v, t) {
  const { status, running, glow, selected } = v.state
  const grey = status === 'no_signal'
  if (grey !== v.greyed) {
    for (const m of v.materials) {
      if (grey) { const c = m.userData.base; const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11; m.color.setRGB(l, l, l) }
      else m.color.copy(m.userData.base)
    }
    v.greyed = grey
  }
  // floor at .55 so a still frame never catches the part un-lit
  const pulse = reduceMotion() ? 0.8 : 0.775 + 0.225 * Math.sin(t * 4)
  for (const [part, mats] of v.parts) {
    const g = grey ? null : glow?.[part]
    for (const m of mats) {
      if (!grey) m.color.copy(m.userData.base)
      if (g) {
        m.color.lerp(TINT.set(GLOW[g]), g === 'danger' ? 0.85 : 0.6)   // the part itself reads red / amber
        m.emissive.setHex(GLOW[g]); m.emissiveIntensity = g === 'danger' ? pulse : pulse * 0.6
      }
      else if (selected === part && v.controls) { m.emissive.setHex(SELECT); m.emissiveIntensity = 0.35 }
      else m.emissiveIntensity = 0
    }
  }
  if (v.action) v.action.paused = !running || grey || reduceMotion()
}

function clipRect(el) {
  const r = el.getBoundingClientRect()
  let L = r.left, T = r.top, R = r.right, B = r.bottom
  const c = el.parentElement?.closest('[data-clip]')
  if (c) { const q = c.getBoundingClientRect(); L = Math.max(L, q.left); T = Math.max(T, q.top); R = Math.min(R, q.right); B = Math.min(B, q.bottom) }
  return { r, L, T, R, B }
}

function frame() {
  requestAnimationFrame(frame)
  const dt = Math.min(clock.getDelta(), 0.05)
  const t = clock.elapsedTime
  const W = innerWidth, H = innerHeight
  const pr = renderer.getPixelRatio()
  if (canvas.width !== Math.floor(W * pr) || canvas.height !== Math.floor(H * pr)) renderer.setSize(W, H, false)
  renderer.setScissorTest(false)
  renderer.clear()
  renderer.setScissorTest(true)
  for (const v of views) {
    if (!v.root || !v.el.isConnected || !v.el.offsetParent) continue
    const { r, L, T, R, B } = clipRect(v.el)
    if (R <= L || B <= T || B < 0 || T > H || r.width < 2) continue
    applyLook(v, t)
    v.mixer?.update(dt)
    if (!reduceMotion()) {
      if (v.state.status === 'danger' && v.state.running !== false) {
        v.root.position.x = Math.sin(t * 61) * 0.025
        v.root.position.z = Math.cos(t * 47) * 0.02
      } else v.root.position.set(0, 0, 0)
      if (!v.controls) {
        const s = v.opts.spin
        if (s === 'always' || (s === 'hover' && v.hover)) v.yaw += dt * 0.5
        v.root.rotation.y = v.yaw
      }
    }
    {
      v.cam.aspect = r.width / r.height
      if (!v.controls) {
        v.cam.position.copy(v.home).multiplyScalar(Math.max(1, 1.25 / v.cam.aspect) / (v.opts.zoom ?? 1))
        v.cam.lookAt(0, 0.6, 0)
      } else v.controls.update()
      v.cam.updateProjectionMatrix()
    }
    renderer.setViewport(r.left, H - r.bottom, r.width, r.height)
    renderer.setScissor(L, H - B, R - L, B - T)
    renderer.render(v.scene, v.cam)
    if (v.opts.pinsEl) {
      for (const p of v.opts.pinsEl.querySelectorAll('[data-pin]')) {
        const node = v.pins.get(p.dataset.pin)
        if (!node) continue
        node.getWorldPosition(tmp).project(v.cam)
        p.style.left = `${((tmp.x + 1) / 2) * r.width}px`
        p.style.top = `${((1 - tmp.y) / 2) * r.height - 4}px`
        p.style.visibility = tmp.z < 1 ? 'visible' : 'hidden'
      }
    }
  }
}
