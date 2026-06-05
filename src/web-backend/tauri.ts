/**
 * Thin helpers over the Tauri event system, used to replace Electron IPC.
 *
 * The window.api surface expects Electron-style `() => void` unsubscribe
 * functions, but Tauri's `listen()` resolves the unsubscribe asynchronously.
 * `subscribe()` bridges that gap so call sites stay unchanged.
 */
import { emitTo, listen, type UnlistenFn } from '@tauri-apps/api/event'

/** Window labels — must match tauri.conf.json + runtime-created windows. */
export const CONTROL_PANEL_LABEL = 'control-panel'
export const GAME_SCREEN_LABEL = 'game-screen'

export function subscribe<T>(event: string, cb: (payload: T) => void): () => void {
  let unlisten: UnlistenFn | null = null
  let cancelled = false
  listen<T>(event, (e) => cb(e.payload)).then((un) => {
    if (cancelled) un()
    else unlisten = un
  })
  return () => {
    cancelled = true
    unlisten?.()
    unlisten = null
  }
}

export { emitTo }

/** Best-effort `process.platform`-compatible string from the user agent. */
export function detectPlatform(): string {
  const ua = (navigator.userAgent || '').toLowerCase()
  if (ua.includes('windows')) return 'win32'
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'darwin'
  return 'linux'
}
