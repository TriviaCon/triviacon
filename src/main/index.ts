import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import { mkdirSync, accessSync, constants as fsConstants } from 'fs'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import {
  createControlPanelWindow,
  createGameScreenWindow,
  getGameScreenWindow,
  toggleGameScreenFullscreen
} from './windows'
import { registerIpcHandlers, getEngine } from './ipc'
import { getControlPanelWindow } from './windows'
import { IPC } from '@shared/types/ipc'
import { GamePhase } from '@shared/types/state'
import { MEDIA_PROTOCOL, registerMediaProtocol } from './mediaProtocol'
import { cleanupTempDirs, cleanupStaleRuntimeDirs } from '../data/quizFile'
import { getPortableRoot } from './portablePath'

// Redirect Electron/Chromium userData to a portable location next to the exe.
// Prevents cache, cookies, GPU data, etc. from scattering into ~/.config (Linux),
// ~/AppData (Windows), or ~/Library (macOS). Falls back to the default when the
// exe directory is not writable (e.g. /opt, /Applications).
if (app.isPackaged) {
  try {
    const portableUserData = join(getPortableRoot(), 'userdata')
    mkdirSync(portableUserData, { recursive: true })
    accessSync(portableUserData, fsConstants.W_OK)
    app.setPath('userData', portableUserData)
  } catch {
    // Portable root not writable — keep default userData path
  }
}

// Register custom protocol scheme before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: MEDIA_PROTOCOL,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

app.whenReady().then(async () => {
  await cleanupStaleRuntimeDirs()

  electronApp.setAppUserModelId('io.github.triviacon.triviacon')

  registerMediaProtocol()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()

  // Display management
  ipcMain.handle(IPC.DISPLAY_OPEN_SCREEN, () => {
    const existing = getGameScreenWindow()
    if (existing) {
      existing.focus()
      return
    }

    const engine = getEngine()

    // Transition from Builder to Splash on first game screen open
    if (engine.getState().phase === GamePhase.Builder) {
      engine.showSplash()
      const cp = getControlPanelWindow()
      if (cp && !cp.isDestroyed()) cp.webContents.send(IPC.STATE_UPDATE, engine.getState())
    }

    const win = createGameScreenWindow()
    win.webContents.once('did-finish-load', () => {
      if (!win.isDestroyed()) win.webContents.send(IPC.STATE_UPDATE, engine.getState())
    })
  })

  ipcMain.handle(IPC.DISPLAY_TOGGLE_FULLSCREEN, () => {
    return toggleGameScreenFullscreen()
  })

  createControlPanelWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createControlPanelWindow()
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('before-quit', async () => {
  await cleanupTempDirs()
})
