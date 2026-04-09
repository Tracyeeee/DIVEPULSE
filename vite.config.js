import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // 开发时把 /api 转到后端，与 VITE_API_BASE_URL 默认 /api 一致
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: ['es2017', 'safari14'],
    cssTarget: 'safari14'
  }
})
