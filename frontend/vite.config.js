import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the React app calls relative URLs like /api/predict and Vite
// forwards them to the local FastAPI server (so there are no CORS issues and
// no localhost URL inside the application code).
// In production the app calls the URL in the VITE_API_URL environment variable.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
})
