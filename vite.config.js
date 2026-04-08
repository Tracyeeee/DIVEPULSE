import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  build: {
    // 兼容更多 iOS / 微信内置浏览器
    target: ['es2017', 'safari14'],
    cssTarget: 'safari14'
  }
})
