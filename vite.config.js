import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { apiDevMiddleware } from './vite-plugins/apiMiddleware.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    base: '/sdr/',
    plugins: [react(), apiDevMiddleware()],
    server: {
      port: process.env.PORT ? Number(process.env.PORT) : 5173,
    },
  }
})
