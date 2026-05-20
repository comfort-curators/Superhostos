import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@superhostos': path.resolve(__dirname, '../../packages')
    }
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})