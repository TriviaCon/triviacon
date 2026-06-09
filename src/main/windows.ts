import { join } from 'path'
import { BrowserWindow, ipcMain, shell } from 'electron'
import { IPC } from '@shared/types/ipc'
import { isDirty } from '../data/quizStore'
import quizFile from '../data/quizFile'

let controlPanelWindow: BrowserWindow | null = null
let gameScreenWindow: BrowserWindow | null = null

export function getControlPanelWindow(): BrowserWindow | null {
  return controlPanelWindow
}

export function getGameScreenWindow(): BrowserWindow | null {
  return gameScreenWindow
}

export function createControlPanelWindow(): BrowserWindow {
  controlPanelWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: 'TriviaCON — Control Panel',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/controlPanel.js'),
      sandbox: false
    }
  })

  controlPanelWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    controlPanelWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/control-panel/`)
  } else {
    controlPanelWindow.loadFile(join(__dirname, '../renderer/control-panel/index.html'))
  }

  let forceClose = false

  controlPanelWindow.on('close', (e) => {
    if (forceClose || !isDirty()) return
    e.preventDefault()
    controlPanelWindow!.webContents.send(IPC.APP_CLOSE_REQUEST)
  })

  ipcMain.handle(IPC.APP_CLOSE_RESPOND, async (_, choice: 'save' | 'discard' | 'cancel') => {
    if (choice === 'cancel') return
    if (choice === 'save') {
      try { await quizFile.save() } catch { return }
    }
    forceClose = true
    controlPanelWindow?.close()
  })

  controlPanelWindow.on('closed', () => {
    controlPanelWindow = null
    gameScreenWindow?.close()
  })

  return controlPanelWindow
}

export function createGameScreenWindow(): BrowserWindow {
  gameScreenWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'TriviaCON',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/gameScreen.js'),
      sandbox: false
    }
  })

  gameScreenWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    gameScreenWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/game-screen/`)
  } else {
    gameScreenWindow.loadFile(join(__dirname, '../renderer/game-screen/index.html'))
  }

  gameScreenWindow.on('closed', () => {
    gameScreenWindow = null
  })

  return gameScreenWindow
}

export function toggleGameScreenFullscreen(): boolean {
  if (!gameScreenWindow) return false
  const next = !gameScreenWindow.isFullScreen()
  gameScreenWindow.setFullScreen(next)
  return next
}
