import { defineConfig, type Plugin } from 'vite'
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
  build: {
    rollupOptions: {
      output: {
        // Stable cache boundaries: the UI shell changes more often than the
        // curriculum, while React and chess.js are third-party foundations.
        // Keeping them separate lowers startup parse cost and makes routine
        // releases download less code without changing offline availability.
        manualChunks(id) {
          const path = id.replace(/\\/g, '/')
          if (path.includes('/node_modules/react/') || path.includes('/node_modules/react-dom/') || path.includes('/node_modules/scheduler/')) return 'react-vendor'
          if (path.includes('/node_modules/chess.js/')) return 'chess-vendor'
          if (path.includes('/src/content/items/')) return 'learning-items'
        },
      },
    },
  },
  server: { port: Number(process.env.PORT) || 5199, strictPort: true },
  preview: { port: Number(process.env.PORT) || 4199, strictPort: true },
})
