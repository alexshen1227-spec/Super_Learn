import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Stamped once per build; the deployed version.json lets running clients
// detect that a newer build has shipped and offer a refresh at a safe moment
// (never during an active learning session).
const buildId = Date.now().toString(36)

function emitVersion(): Plugin {
  return {
    name: 'emit-version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ build: buildId }),
      })
    },
  }
}

export default defineConfig({
  // Served from https://<user>.github.io/<repo>/ when built in CI; root locally.
  base: process.env.GITHUB_PAGES ? '/Super_Learn/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    emitVersion(),
    VitePWA({
      // The app shows its own refresh banner; the waiting service worker
      // activates only when the user accepts, so mid-session state is never
      // yanked away by an update.
      registerType: 'prompt',
      manifest: false, // public/manifest.webmanifest is hand-maintained
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'manifest.webmanifest'],
      workbox: {
        /*
         * The content bundle is one big chunk and it has to be precached.
         *
         * Workbox refuses anything over 2 MiB by default, and the question-bank
         * chunk crossed that line as the bank grew. Silently leaving it out is
         * the worst available outcome for this app specifically: a learner who
         * installs the PWA and opens it on a train would get a shell with no
         * questions in it, which reads as the app being broken rather than as a
         * caching limit. Offline-first is a founding constraint, so the limit
         * moves rather than the content.
         *
         * The cost is honest and bounded: a larger first-install download. It
         * is a one-off, it is already being downloaded on first visit, and the
         * chunk is content rather than code, so it changes only when the bank
         * does.
         */
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        globIgnores: [
          // version.json must always come from the network — it is the update signal.
          '**/version.json',
          // Font subsets an English-only interface never renders. @font-face
          // declares unicode-range per file, so the browser only requests them
          // when such a glyph appears; precaching would cost every install.
          '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-wght-normal-*.woff2',
        ],
        cleanupOutdatedCaches: true,
        // Everything is local; there are no runtime network dependencies.
        runtimeCaching: [],
      },
    }),
  ],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  // Keep Vitest inside this worktree. Developer-tool scratch worktrees can sit
  // below the repo root, and discovering their copied tests doubled the suite.
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    /*
     * Two tests are legitimately slow: the chess bank re-runs a real search for
     * every tactic, and the content audit renders all 832 templates across many
     * seeds. Both pass comfortably alone and both intermittently tripped the
     * 5-second default when the suite ran them alongside everything else — a
     * flake that says nothing about the code and would fail a CI run at random.
     */
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
  build: {
    rollupOptions: {
      output: {
        // Stable cache boundaries: the UI shell changes more often than the
        // curriculum, while React and chess.js are third-party foundations.
        // Authentic-work simulations are their own cache boundary: they are
        // substantial and evolve independently from the short item bank.
        // Keeping these separate makes routine releases download less code
        // without changing offline availability.
        manualChunks(id) {
          const path = id.replace(/\\/g, '/')
          if (path.includes('/node_modules/react/') || path.includes('/node_modules/react-dom/') || path.includes('/node_modules/scheduler/')) return 'react-vendor'
          if (path.includes('/node_modules/chess.js/')) return 'chess-vendor'
          if (path.endsWith('/src/content/items/authenticWork.ts') || path.endsWith('/src/content/items/realWorldPractice.ts')) return 'authentic-work-items'
          if (path.includes('/src/content/items/')) {
            const file = path.split('/').pop()?.replace(/\.ts$/, '') ?? ''
            const math = new Set(['mathNumber', 'mathAlgebra', 'algebraOne', 'algebraDepth', 'gradeCore', 'middleDepth', 'nonRoutine', 'workedChains', 'hsBridge', 'hsDensity'])
            const stem = new Set(['physics', 'physicsDepth', 'science', 'coding', 'advancedScience', 'advancedStem', 'advancedCurriculum'])
            const paths = new Set(['observer', 'investigator', 'strategist', 'insight', 'gameTheory', 'abduction', 'counterexamples', 'pathQuestionDepth', 'pathQuestionExpansion', 'labsDepth', 'generatedLabs'])
            const puzzles = new Set(['chessTactics', 'constraintPuzzles', 'logicPuzzles', 'polyominoPuzzles', 'generatedPuzzles'])
            if (math.has(file)) return 'learning-math'
            if (stem.has(file)) return 'learning-stem'
            if (paths.has(file)) return 'learning-paths'
            if (puzzles.has(file)) return 'learning-puzzles'
            return 'learning-meta'
          }
        },
      },
    },
  },
  server: { port: Number(process.env.PORT) || 5199, strictPort: true },
  preview: { port: Number(process.env.PORT) || 4199, strictPort: true },
})
