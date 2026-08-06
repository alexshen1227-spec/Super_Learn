// Generates PWA PNG icons procedurally — no image dependencies.
// Draws the Axiom Lab mark (three connected nodes on an ink field) into an
// RGBA buffer with signed-distance anti-aliasing, then encodes a valid PNG
// using node:zlib for the IDAT deflate stream.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---------- PNG encoding ----------
function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let c = ~0
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // filter type 0 per scanline
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ---------- drawing ----------
const INK = [13, 20, 32] // #0d1420
const EDGE = [58, 74, 99] // #3a4a63
const CYAN = [34, 211, 238]
const GREEN = [74, 222, 128]
const AMBER = [245, 158, 11]

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (d, aa) => clamp01(0.5 - d / aa)

function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r
}
function sdSegment(px, py, ax, ay, bx, by, w) {
  const abx = bx - ax
  const aby = by - ay
  const t = clamp01(((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby))
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t)) - w
}
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r)
  const qy = Math.abs(py - cy) - (hh - r)
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r
}

function blend(dst, src, cov) {
  return [
    dst[0] + (src[0] - dst[0]) * cov,
    dst[1] + (src[1] - dst[1]) * cov,
    dst[2] + (src[2] - dst[2]) * cov,
  ]
}

/** Render the mark at `size` px. `pad` = fraction of size around the rounded square (0 for maskable-style full bleed). */
function render(size, { rounded = true } = {}) {
  const buf = Buffer.alloc(size * size * 4)
  const aa = 1.25 / size // anti-alias band in unit space
  // Node layout in unit coordinates (kept inside the maskable safe zone).
  const A = [0.3, 0.68, 0.078, GREEN]
  const B = [0.5, 0.32, 0.086, CYAN]
  const C = [0.72, 0.62, 0.07, AMBER]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size
      const v = (y + 0.5) / size
      let color = [0, 0, 0]
      let alpha = 0
      // background: rounded square (or full square when not rounded)
      const bgD = rounded ? sdRoundRect(u, v, 0.5, 0.5, 0.5, 0.5, 0.219) : -1
      const bgCov = smooth(bgD, aa)
      if (bgCov > 0) {
        color = blend(color, INK, 1)
        alpha = bgCov
        // edges
        for (const [ax, ay, bx, by] of [
          [A[0], A[1], B[0], B[1]],
          [B[0], B[1], C[0], C[1]],
        ]) {
          const d = sdSegment(u, v, ax, ay, bx, by, 0.0175)
          color = blend(color, EDGE, smooth(d, aa))
        }
        // nodes
        for (const [cx, cy, r, col] of [A, B, C]) {
          const d = sdCircle(u, v, cx, cy, r)
          color = blend(color, col, smooth(d, aa))
        }
      }
      const i = (y * size + x) * 4
      buf[i] = Math.round(color[0])
      buf[i + 1] = Math.round(color[1])
      buf[i + 2] = Math.round(color[2])
      buf[i + 3] = Math.round(alpha * 255)
    }
  }
  return buf
}

mkdirSync(join(root, 'public'), { recursive: true })
for (const [file, size, opts] of [
  ['icon-192.png', 192, { rounded: false }],
  ['icon-512.png', 512, { rounded: false }],
  ['apple-touch-icon.png', 180, { rounded: false }],
]) {
  const png = encodePng(size, size, render(size, opts))
  writeFileSync(join(root, 'public', file), png)
  console.log(`wrote public/${file} (${png.length} bytes)`)
}
