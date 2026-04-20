import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error — @tailwindcss/vite only ships .d.mts; works fine at runtime
import tailwindcss from '@tailwindcss/vite'
import { version } from './package.json'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        input: {
          controlPanel: resolve(__dirname, 'src/preload/controlPanel.ts'),
          gameScreen: resolve(__dirname, 'src/preload/gameScreen.ts')
        }
      }
    }
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(version)
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/control-panel/src'),
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        input: {
          controlPanel: resolve(__dirname, 'src/renderer/control-panel/index.html'),
          gameScreen: resolve(__dirname, 'src/renderer/game-screen/index.html')
        }
      }
    }
  }
})
