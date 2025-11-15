import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // forward calls beginning with /api to your backend
      '/api': {
        target: 'https://database-dashboard-backend.onrender.com',
        changeOrigin: true,
        secure: false
      },
      // if your frontend calls /generated_resumes directly, proxy that too
      '/generated_resumes': {
        target: 'https://database-dashboard-backend.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})