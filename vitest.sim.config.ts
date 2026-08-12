/**
 * Simulations are not unit tests. They play a learner forward through years of
 * real `buildSessionPlan` calls and take minutes, so they live behind their own
 * config and their own `npm run sim` rather than slowing the release gate.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/sim/**/*.sim.ts'],
    testTimeout: 3_600_000,
    hookTimeout: 3_600_000,
  },
})
