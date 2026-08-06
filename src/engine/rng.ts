/**
 * Deterministic PRNG (mulberry32). Content generators must derive every random
 * choice from this so that (templateId, seed) always renders the same item —
 * required for session recovery and honest re-grading.
 */
export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer in [lo, hi] inclusive. */
export function rint(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1))
}

/** Pick one element. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Fisher-Yates shuffle (new array). */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Non-zero integer in [-mag, mag]. */
export function rnz(rng: Rng, mag: number): number {
  const v = rint(rng, 1, mag)
  return rng() < 0.5 ? -v : v
}

/** Stable 32-bit hash of a string (for deriving seeds from ids). */
export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

let idCounter = 0
/** Unique-enough id for events/sessions: time + counter + entropy. */
export function uid(prefix = ''): string {
  idCounter = (idCounter + 1) % 46656
  const t = Date.now().toString(36)
  const c = idCounter.toString(36).padStart(3, '0')
  const r = Math.floor(Math.random() * 46656)
    .toString(36)
    .padStart(3, '0')
  return `${prefix}${t}${c}${r}`
}
