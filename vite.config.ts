import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/** Deployed backend. Override with API_PROXY_TARGET to develop against a local one. */
const DEFAULT_TARGET = 'https://elizade-backend-api-production.up.railway.app'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        // Dev requests stay same-origin and are forwarded server-side, so the
        // browser never makes a cross-origin call and CORS never applies. A
        // local backend is one env var away:
        //   API_PROXY_TARGET=http://localhost:8000 npm run dev
        '/api': {
          target: env.API_PROXY_TARGET || DEFAULT_TARGET,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
