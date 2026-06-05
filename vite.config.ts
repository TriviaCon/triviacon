import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error — @tailwindcss/vite only ships .d.mts; works fine at runtime
import tailwindcss from '@tailwindcss/vite'
import { version } from './package.json'

const host = process.env.TAURI_DEV_HOST

// Plain Vite config used by the Tauri build (multi-page: control panel + game screen).
// The Electron build keeps using electron.vite.config.ts independently.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version)
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/control-panel/src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@web': resolve(__dirname, 'src/web-backend')
    }
  },
  // Tauri expects a fixed dev port and should not clear the terminal.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: { ignored: ['**/src-tauri/**'] }
  },
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        controlPanel: resolve(__dirname, 'src/renderer/control-panel/index.html'),
        gameScreen: resolve(__dirname, 'src/renderer/game-screen/index.html')
      }
    }
  }
})
