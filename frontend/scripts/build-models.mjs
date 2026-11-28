// Writes the procedural machines in src/twin/models.js to .glb for web + Android.
// Run: npm run models
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { buildModel, KINDS } from '../src/twin/models.js'

// GLTFExporter reads Blobs through FileReader, which Node lacks.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.() }) }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(b).toString('base64')}`
      this.onloadend?.()
    })
  }
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const outs = [resolve(root, 'frontend/public/models'), resolve(root, 'android/app/src/main/assets/models')]
outs.forEach((d) => mkdirSync(d, { recursive: true }))

const exporter = new GLTFExporter()
for (const kind of KINDS) {
  const { scene, clip } = buildModel(kind)
  const glb = await exporter.parseAsync(scene, { binary: true, animations: [clip] })
  for (const d of outs) writeFileSync(resolve(d, `${kind}.glb`), Buffer.from(glb))
  console.log(`[models] ${kind}.glb  ${(glb.byteLength / 1024).toFixed(0)} KB`)
}
