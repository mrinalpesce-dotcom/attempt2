import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // SentinelAI Python backend (prevention + detection engine)
      '/api/prevention': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/sentinel': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Node.js backend (everything else)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
