import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
      contextBridge.exposeInMainWorld('electron', {
        ipcRenderer: {
          invoke: (channel: string, ...args: unknown[]) => {
            if (channel === 'read-mock-file') {
              return require('fs').promises.readFile(args[0] as string, 'utf8')
            }
            return ipcRenderer.invoke(channel, ...args)
          }        }
      })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
