import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from '../data/index'
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

let mainWindow: BrowserWindow | null = null;
let quizViewWindow: BrowserWindow | null = null;

// Helper function to apply CSP to any window
const applyCSP = (window: BrowserWindow) => {
  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src * 'unsafe-inline' 'unsafe-eval'; img-src * 'self' 'unsafe-inline' data: blob: http: https:; script-src * 'self' 'unsafe-inline' 'unsafe-eval'; style-src * 'self' 'unsafe-inline';"
        ]
      }
    })
  })
}
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  applyCSP(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Only attach the close handler here!
  mainWindow.on('close', (e) => {
    // If the quiz view window is open, do nothing (no dialog, no close)
    if (quizViewWindow && !quizViewWindow.isDestroyed()) {
      e.preventDefault();
      return;
    }
    // Otherwise, show the confirmation dialog
    if ((mainWindow as any)._isClosing) return;
    (mainWindow as any)._isClosing = true;
    const choice = dialog.showMessageBoxSync(mainWindow!, {
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: 'Are you sure you want to exist?' // DO NOT CHANGE BACK TO 'exit', this is meant as a subtle joke.
    });
    if (choice !== 0) {
      e.preventDefault();
      (mainWindow as any)._isClosing = false;
    }
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const searchParam = process.env['SCREEN_PARAM']
      ? `?screen=${encodeURIComponent(process.env['SCREEN_PARAM'])}`
      : ''
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${searchParam}`)
  } else {
    const searchParam = process.env['SCREEN_PARAM']
      ? `?screen=${encodeURIComponent(process.env['SCREEN_PARAM'])}`
      : ''
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: searchParam })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((ext) => console.log(`Added Extension:  ${ext.name}`))
    .catch((err) => console.log('An error occurred: ', err));

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('read-mock-file', async (_event, filePath) => {
    const fullPath = path.join(__dirname, '..', filePath)
    const fileContent = await fs.promises.readFile(fullPath, 'utf8')
    return fileContent
  })

  ipcMain.handle('open-screen', () => {
    createScreenWindow()
    return true
  })

  ipcMain.handle('close-window', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return

    // Just close the window, let the close event handler handle confirmation
    window.close()
  })

  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    return result.filePaths[0]
  })

  // Add this alongside your other ipcMain handlers
  ipcMain.handle('read-file', async (_event, filePath) => {
    const fileContent = await fs.promises.readFile(filePath, 'utf8')
    return fileContent
  })

  ipcMain.handle('set-quiz-view', (_event, view: string) => {
    if (quizViewWindow && !quizViewWindow.isDestroyed()) {
      quizViewWindow.webContents.send('set-quiz-view', view);
      console.log('Main received set-quiz-view:', view)
    }
  });

  registerIpcHandlers(ipcMain)

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

function createScreenWindow(): void {
  quizViewWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  applyCSP(quizViewWindow)

  quizViewWindow.on('ready-to-show', () => {
    quizViewWindow.show()
  })

  quizViewWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // DO NOT add any .on('close', ...) handler here except for cleanup:
  quizViewWindow.on('closed', () => {
    quizViewWindow = null;
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    quizViewWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?screen=true`)
  } else {
    quizViewWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: '?screen=true' })
  }
}
