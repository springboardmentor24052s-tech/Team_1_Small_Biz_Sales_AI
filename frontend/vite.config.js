import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxies /api/* straight through to your FastAPI backend so the
// frontend can call relative paths like /api/login without CORS headaches.
// Your backend routes are flat (e.g. /login, /kpi, /inventory), so the proxy
// simply strips the /api prefix before forwarding.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
