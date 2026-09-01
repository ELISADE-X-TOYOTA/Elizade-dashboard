import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/** Local backend. Override with API_PROXY_TARGET to point at a deployed one. */
const DEFAULT_TARGET = 'http://localhost:8000'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // Relative asset paths, so `dist/index.html` works when opened straight off
    // the filesystem or served from a subdirectory. Vite's default absolute
    // "/assets/..." paths 404 under file://, which would leave anyone handed
    // the folder looking at a blank page.
    base: './',
    server: {
      port: 5174,
      proxy: {
        // Dev requests stay same-origin and are forwarded server-side, so the
        // browser never makes a cross-origin call and CORS never applies. The
        // deployed backend is one env var away:
        //   API_PROXY_TARGET=https://elizade-backend-api-production.up.railway.app npm run dev
        '/api': {
          target: env.API_PROXY_TARGET || DEFAULT_TARGET,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
