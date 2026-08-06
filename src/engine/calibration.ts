/**
 * Confidence calibration analytics.
 * Confidence is recorded 0..100 on selected items; we bin accuracy by band
 * and compute Brier scores for forecasts.
 */
import type { AttemptEvent, Forecast } from '../domain/types'

export interface CalibrationBand {
  /** Band label, e.g. "60–79%". */
  label: string
  lo: number
  hi: number
  n: number
  accuracy: number | null
  /** Mean stated confidence in the band (0..1). */
  meanConfidence: number | null
}

export const BANDS: { lo: number; hi: number; label: string }[] = [
  { lo: 0, hi: 39, label: '0–39%' },
  { lo: 40, hi: 59, label: '40–59%' },
  { lo: 60, hi: 79, label: '60–79%' },
  { lo: 80, hi: 100, label: '80–100%' },
]

export function calibrationBands(events: AttemptEvent[]): CalibrationBand[] {
  return BANDS.map((b) => {
    const inBand = events.filter(
      (e) => e.confidence !== null && e.confidence >= b.lo && e.confidence <= b.hi && e.firstCorrect !== null,
    )
    const n = inBand.length
    const correct = inBand.filter((e) => e.firstCorrect).length
    const meanConf = n ? inBand.reduce((a, e) => a + (e.confidence ?? 0), 0) / n / 100 : null
    return {
      label: b.label,
      lo: b.lo,
      hi: b.hi,
      n,
      accuracy: n >= 3 ? correct / n : null, // refuse to report from <3 samples
      meanConfidence: meanConf,
    }
  })
}

/** Positive = overconfident, negative = underconfident, null = not enough data. */
export function calibrationGap(events: AttemptEvent[]): number | null {
  const rated = events.filter((e) => e.confidence !== null && e.firstCorrect !== null)
  if (rated.length < 8) return null
  const meanConf = rated.reduce((a, e) => a + (e.confidence ?? 0), 0) / rated.length / 100
  const accuracy = rated.filter((e) => e.firstCorrect).length / rated.length
  return meanConf - accuracy
}

export function highConfidenceErrors(events: AttemptEvent[]): AttemptEvent[] {
  return events.filter(
    (e) => e.firstCorrect === false && e.confidence !== null && e.confidence >= 80,
  )
}

/** Brier score for resolved forecasts: mean (p - outcome)^2. Lower is better. */
export function brierScore(forecasts: Forecast[]): { score: number; n: number } | null {
  const resolved = forecasts.filter((f) => f.resolved !== null)
  if (resolved.length === 0) return null
  const sum = resolved.reduce((a, f) => {
    const o = f.resolved!.outcome ? 1 : 0
    return a + (f.probability - o) ** 2
  }, 0)
  return { score: sum / resolved.length, n: resolved.length }
}
