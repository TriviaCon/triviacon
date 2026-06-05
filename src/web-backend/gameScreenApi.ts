/**
 * Game-screen window.api implementation for the Tauri build.
 *
 * The game screen is a pure consumer: it listens for state + media commands
 * from the control panel (Tauri events) and reports media playback state back.
 * Mirrors src/preload/gameScreen.ts.
 */
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { setMediaBaseDir } from '@shared/mediaUrl'
import { subscribe, emitTo, CONTROL_PANEL_LABEL } from './tauri'
import * as settings from './settingsWeb'
import { IPC } from '@shared/types/ipc'
import type { MediaPlaybackState } from '@shared/types/ipc'
import type { GameState } from '@shared/types/state'

export const api = {
  onStateUpdate: (cb: (state: GameState) => void) => {
    let unlisten: UnlistenFn | null = null
    let cancelled = false
    listen<GameState>(IPC.STATE_UPDATE, (e) => {
      const s = e.payload
      if (s.mediaBaseDir) setMediaBaseDir(s.mediaBaseDir)
      cb(s)
    }).then((un) => {
      if (cancelled) {
        un()
        return
      }
      unlisten = un
      // Listener is live — ask the control panel to push the current state.
      emitTo(CONTROL_PANEL_LABEL, 'game-screen:ready').catch(() => {})
    })
    return () => {
      cancelled = true
      unlisten?.()
    }
  },

  // ── Media playback listeners (control panel → game screen) ──────────
  onMediaPlay: (cb: () => void) => subscribe<void>(IPC.MEDIA_PLAY, () => cb()),
  onMediaPause: (cb: () => void) => subscribe<void>(IPC.MEDIA_PAUSE, () => cb()),
  onMediaStop: (cb: () => void) => subscribe<void>(IPC.MEDIA_STOP, () => cb()),
  onMediaToggleFullscreen: (cb: () => void) =>
    subscribe<void>(IPC.MEDIA_TOGGLE_FULLSCREEN, () => cb()),
  onMediaSeek: (cb: (time: number) => void) => subscribe<number>(IPC.MEDIA_SEEK, cb),
  onMediaSetVolume: (cb: (volume: number) => void) => subscribe<number>(IPC.MEDIA_SET_VOLUME, cb),
  sendMediaState: (state: MediaPlaybackState) => {
    emitTo(CONTROL_PANEL_LABEL, IPC.MEDIA_STATE_UPDATE, state).catch(() => {})
  },

  // ── Settings (read-only) ────────────────────────────────────────────
  getLanguage: async () => settings.getSetting('language'),
  onLanguageChange: (cb: (lang: string) => void) =>
    subscribe<string>(IPC.SETTINGS_SET_LANGUAGE, cb),
  getDefaultVolume: async () => settings.getSetting('defaultVolume'),
  getVisualizer: async () => ({
    colorMode: await settings.getSetting('visualizerColorMode'),
    barCount: await settings.getSetting('visualizerBarCount')
  })
}
