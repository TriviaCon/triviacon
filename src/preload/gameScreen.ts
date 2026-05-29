import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/types/ipc'
import type { MediaPlaybackState } from '@shared/types/ipc'
import type { GameState } from '@shared/types/state'

/** Subscribe to a bare IPC event (no payload). Returns an unsubscribe function. */
function subscribe(channel: string, callback: () => void): () => void {
  const handler = (): void => callback()
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

/** Subscribe to an IPC event carrying a single payload. Returns an unsubscribe function. */
function subscribeWith<T>(channel: string, callback: (payload: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api = {
  onStateUpdate: (cb: (state: GameState) => void) => subscribeWith<GameState>(IPC.STATE_UPDATE, cb),

  // ── Media playback listeners (main -> game screen) ─────────────
  onMediaPlay: (cb: () => void) => subscribe(IPC.MEDIA_PLAY, cb),
  onMediaPause: (cb: () => void) => subscribe(IPC.MEDIA_PAUSE, cb),
  onMediaStop: (cb: () => void) => subscribe(IPC.MEDIA_STOP, cb),
  onMediaToggleFullscreen: (cb: () => void) => subscribe(IPC.MEDIA_TOGGLE_FULLSCREEN, cb),
  onMediaSeek: (cb: (time: number) => void) => subscribeWith<number>(IPC.MEDIA_SEEK, cb),
  onMediaSetVolume: (cb: (volume: number) => void) =>
    subscribeWith<number>(IPC.MEDIA_SET_VOLUME, cb),
  sendMediaState: (state: MediaPlaybackState) =>
    ipcRenderer.send(IPC.MEDIA_STATE_UPDATE, state),

  // ── Settings ───────────────────────────────────────────────────
  getLanguage: (): Promise<string> => ipcRenderer.invoke(IPC.SETTINGS_GET_LANGUAGE),
  onLanguageChange: (cb: (lang: string) => void) =>
    subscribeWith<string>(IPC.SETTINGS_SET_LANGUAGE, cb),
  getDefaultVolume: (): Promise<number> => ipcRenderer.invoke(IPC.SETTINGS_GET_DEFAULT_VOLUME),
  getVisualizer: (): Promise<{ colorMode: string; barCount: number }> =>
    ipcRenderer.invoke(IPC.SETTINGS_GET_VISUALIZER)
}

export type GameScreenApi = typeof api

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error fallback for non-isolated context
  window.api = api
}
