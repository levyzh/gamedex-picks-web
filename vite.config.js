import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port pinned to 5174 on purpose. The main Gamedex app takes Vite's default
// 5173, and if both are running Vite silently bumps this one to 5174 anyway —
// at which point the API's CORS list wouldn't match and the request gets
// blocked with a message that doesn't mention ports at all. Pinning it with
// strictPort means it either starts on the origin the API expects, or refuses
// to start. Loud beats mysterious.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
})
