/**
 * Control-panel window.api implementation for the Tauri build.
 *
 * The control panel is the single source of truth: it owns the GameEngine and
 * the in-memory quiz store, performs all file/media I/O, and broadcasts state
 * to itself (local listeners) and to the game-screen window (Tauri events).
 *
 * Mirrors src/main/ipc/index.ts + the display handlers in src/main/index.ts
 * and the window lifecycle in src/main/windows.ts.
 */
import { getCurrentWindow } from '@tauri-apps/api/window'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { open as openDialog, save as saveDialog, ask } from '@tauri-apps/plugin-dialog'

import { GameEngine } from '../main/state/GameEngine'
import * as store from '../data/quizStore'
import * as quizFile from './quizFileWeb'
import * as settings from './settingsWeb'
import { setMediaBaseDir } from '@shared/mediaUrl'
import { subscribe, emitTo, detectPlatform, GAME_SCREEN_LABEL } from './tauri'

import { IPC } from '@shared/types/ipc'
import type { MediaPlaybackState } from '@shared/types/ipc'
import { GamePhase, type GameState } from '@shared/types/state'
import type { AnswerOption, Question } from '@shared/types/quiz'
import { QUIZ_FILE_FILTER } from '@shared/constants'

const engine = new GameEngine()
const stateListeners = new Set<(s: GameState) => void>()
const langListeners = new Set<(lang: string) => void>()

function currentPayload(): GameState {
  return { ...engine.getState(), mediaBaseDir: quizFile.getMediaDir() }
}

export function broadcast(): void {
  const payload = currentPayload()
  stateListeners.forEach((l) => l(payload))
  emitTo(GAME_SCREEN_LABEL, IPC.STATE_UPDATE, payload).catch(() => {})
}

function persistTeams(): void {
  try {
    store.teamsSaveAll(engine.getState().teams)
  } catch (err) {
    console.error('Failed to persist teams:', err)
  }
}

function ensureTcq(path: string): string {
  return path.toLowerCase().endsWith('.tcq') ? path : `${path}.tcq`
}

const MEDIA_EXTENSIONS = [
  'mp3', 'wav', 'ogg', 'aac', 'm4a',
  'mp4', 'webm', 'mov',
  'png', 'jpg', 'jpeg', 'gif', 'webp'
]

export const api = {
  // ── State subscription (local; control panel produces state) ───────
  onStateUpdate: (cb: (state: GameState) => void) => {
    stateListeners.add(cb)
    cb(currentPayload())
    return () => stateListeners.delete(cb)
  },

  // ── File operations ────────────────────────────────────────────────
  fileNew: async (): Promise<string | null> => {
    const picked = await saveDialog({ filters: [QUIZ_FILE_FILTER] })
    if (!picked) return null
    const path = ensureTcq(picked)
    await quizFile.newQuiz(path)
    setMediaBaseDir(quizFile.getMediaDir())
    engine.loadQuiz(path, store.metaGet(), store.categoriesAll(), store.questionCategoryMap())
    broadcast()
    return path
  },

  fileOpen: async (): Promise<string | null> => {
    const picked = await openDialog({
      filters: [QUIZ_FILE_FILTER],
      multiple: false,
      directory: false
    })
    if (!picked || Array.isArray(picked)) return null
    await quizFile.openQuiz(picked)
    setMediaBaseDir(quizFile.getMediaDir())
    engine.loadQuiz(
      picked,
      store.metaGet(),
      store.categoriesAll(),
      store.questionCategoryMap(),
      store.teamsAll()
    )
    broadcast()
    return picked
  },

  fileSave: async (): Promise<boolean> => {
    await quizFile.save()
    return true
  },

  fileSaveAs: async (): Promise<string | null> => {
    const picked = await saveDialog({ filters: [QUIZ_FILE_FILTER] })
    if (!picked) return null
    const path = ensureTcq(picked)
    await quizFile.saveTo(path)
    broadcast()
    return path
  },

  // ── Categories ─────────────────────────────────────────────────────
  categoriesAll: async () => store.categoriesAll(),
  categoryById: async (id: number) => store.categoryById(id),
  categoryCreate: async (name: string) => {
    const id = store.categoryCreate(name)
    engine.updateCategories(store.categoriesAll())
    broadcast()
    return id
  },
  categoryUpdate: async (id: number, name: string) => {
    store.categoryUpdate(id, name)
    engine.updateCategories(store.categoriesAll())
    broadcast()
  },
  categoryRemove: async (id: number) => {
    store.categoryRemove(id)
    engine.updateCategories(store.categoriesAll())
    broadcast()
  },

  // ── Questions ──────────────────────────────────────────────────────
  questionsByCategory: async (categoryId: number) => store.questionsAllByCategoryId(categoryId),
  questionById: async (id: number) => store.questionById(id),
  questionCreate: async (question: Omit<Question, 'id'>) => store.questionCreate(question),
  questionUpdate: async (id: number, updates: Partial<Omit<Question, 'id'>>) =>
    store.questionUpdate(id, updates),
  questionDelete: async (id: number) => {
    const question = store.questionById(id)
    if (question?.media) await quizFile.removeMedia(question.media)
    store.questionDelete(id)
  },

  // ── Answer options ─────────────────────────────────────────────────
  answerOptionsByQuestion: async (questionId: number) => store.answerOptionsByQuestionId(questionId),
  answerOptionCreate: async (
    questionId: number,
    text?: string,
    correct?: boolean,
    sortOrder?: number
  ) => store.answerOptionCreate(questionId, text, correct, sortOrder),
  answerOptionUpdate: async (
    id: number,
    fields: Partial<Omit<AnswerOption, 'id' | 'questionId'>>
  ) => store.answerOptionUpdate(id, fields),
  answerOptionRemove: async (id: number) => store.answerOptionRemove(id),

  // ── Meta ───────────────────────────────────────────────────────────
  quizMetaGet: async () => store.metaGet(),
  quizMetaUpdateName: async (name: string) => {
    store.metaUpdateName(name)
    engine.updateMeta(store.metaGet())
    broadcast()
  },
  quizMetaUpdateAuthor: async (author: string) => {
    store.metaUpdateAuthor(author)
    engine.updateMeta(store.metaGet())
    broadcast()
  },
  quizMetaUpdateDate: async (date: string) => {
    store.metaUpdateDate(date)
    engine.updateMeta(store.metaGet())
    broadcast()
  },
  quizMetaUpdateLocation: async (location: string) => {
    store.metaUpdateLocation(location)
    engine.updateMeta(store.metaGet())
    broadcast()
  },
  quizMetaUpdateSplash: async (splash: string) => {
    store.metaUpdateSplash(splash)
    engine.updateMeta(store.metaGet())
    broadcast()
  },

  // ── Stats ──────────────────────────────────────────────────────────
  quizStats: async () => store.getStats(),

  // ── Team management ────────────────────────────────────────────────
  addTeam: async (name: string) => {
    engine.addTeam(name)
    broadcast()
    persistTeams()
  },
  removeTeam: async (teamId: string) => {
    engine.removeTeam(teamId)
    broadcast()
    persistTeams()
  },
  renameTeam: async (teamId: string, name: string) => {
    engine.renameTeam(teamId, name)
    broadcast()
    persistTeams()
  },
  updateScore: async (teamId: string, delta: number) => {
    engine.updateScore(teamId, delta)
    broadcast()
    persistTeams()
  },
  setCurrentTeam: async (teamId: string) => {
    engine.setCurrentTeam(teamId)
    broadcast()
  },
  nextTeam: async () => {
    engine.nextTeam()
    broadcast()
  },
  prevTeam: async () => {
    engine.prevTeam()
    broadcast()
  },

  // ── Screen transitions ─────────────────────────────────────────────
  showSplash: async () => {
    engine.showSplash()
    broadcast()
  },
  showCategories: async () => {
    engine.showCategories()
    broadcast()
  },
  showQuestions: async (categoryId: number) => {
    engine.showQuestions(categoryId, store.questionsAllByCategoryId(categoryId))
    broadcast()
  },
  showQuestion: async (questionId: number) => {
    const question = store.questionById(questionId)
    if (!question) return
    engine.showQuestion(question, store.answerOptionsByQuestionId(questionId))
    broadcast()
  },
  showRanking: async () => {
    engine.showRanking()
    broadcast()
  },

  // ── Selection ──────────────────────────────────────────────────────
  selectCategory: async (id: number | null) => {
    engine.selectCategory(id)
    broadcast()
  },
  selectQuestion: async (id: number | null) => {
    engine.selectQuestion(id)
    broadcast()
  },

  // ── Question state ─────────────────────────────────────────────────
  toggleAnswer: async (questionId: number) => {
    engine.toggleAnswer(questionId)
    broadcast()
  },
  markUsed: async (questionId: number) => {
    engine.markUsed(questionId)
    broadcast()
  },
  markAnswer: async (answerOptionId: number | null) => {
    engine.markAnswer(answerOptionId)
    broadcast()
  },
  toggleListOption: async (answerOptionId: number) => {
    engine.toggleListOption(answerOptionId)
    broadcast()
  },

  // ── Media management ───────────────────────────────────────────────
  mediaPickFile: async (questionId: number): Promise<string | null> => {
    const picked = await openDialog({
      filters: [{ name: 'Media', extensions: MEDIA_EXTENSIONS }],
      multiple: false,
      directory: false
    })
    if (!picked || Array.isArray(picked)) return null
    const filename = picked.split(/[\\/]/).pop() ?? picked
    const mediaPath = await quizFile.attachMediaPath(picked, filename)
    store.questionUpdate(questionId, { media: mediaPath })
    return mediaPath
  },
  // Tauri-specific: attach raw bytes (used by drag & drop, which has no path).
  mediaAttachBytes: async (
    questionId: number,
    bytes: Uint8Array,
    filename: string
  ): Promise<string> => {
    const mediaPath = await quizFile.attachMediaBytes(bytes, filename)
    store.questionUpdate(questionId, { media: mediaPath })
    return mediaPath
  },
  mediaAttachFile: async (questionId: number, filePath: string): Promise<string> => {
    const filename = filePath.split(/[\\/]/).pop() ?? filePath
    const mediaPath = await quizFile.attachMediaPath(filePath, filename)
    store.questionUpdate(questionId, { media: mediaPath })
    return mediaPath
  },
  mediaRemoveFile: async (questionId: number) => {
    const question = store.questionById(questionId)
    if (question?.media) await quizFile.removeMedia(question.media)
    store.questionUpdate(questionId, { media: null })
  },

  // ── Media playback (forward to game screen via events) ─────────────
  mediaPlay: async () => void emitTo(GAME_SCREEN_LABEL, IPC.MEDIA_PLAY),
  mediaPause: async () => void emitTo(GAME_SCREEN_LABEL, IPC.MEDIA_PAUSE),
  mediaStop: async () => void emitTo(GAME_SCREEN_LABEL, IPC.MEDIA_STOP),
  mediaToggleFullscreen: async () => void emitTo(GAME_SCREEN_LABEL, IPC.MEDIA_TOGGLE_FULLSCREEN),
  mediaSeek: async (time: number) => void emitTo(GAME_SCREEN_LABEL, IPC.MEDIA_SEEK, time),
  mediaSetVolume: async (volume: number) => void emitTo(GAME_SCREEN_LABEL, IPC.MEDIA_SET_VOLUME, volume),
  onMediaStateUpdate: (cb: (state: MediaPlaybackState) => void) =>
    subscribe<MediaPlaybackState>(IPC.MEDIA_STATE_UPDATE, cb),

  // ── Settings ───────────────────────────────────────────────────────
  getLanguage: async () => settings.getSetting('language'),
  setLanguage: async (lang: string) => {
    await settings.setSetting('language', lang)
    langListeners.forEach((l) => l(lang))
    emitTo(GAME_SCREEN_LABEL, IPC.SETTINGS_SET_LANGUAGE, lang).catch(() => {})
  },
  onLanguageChange: (cb: (lang: string) => void) => {
    langListeners.add(cb)
    return () => langListeners.delete(cb)
  },
  getDefaultVolume: async () => settings.getSetting('defaultVolume'),
  setDefaultVolume: async (volume: number) => settings.setSetting('defaultVolume', volume),
  getVisualizer: async () => ({
    colorMode: await settings.getSetting('visualizerColorMode'),
    barCount: await settings.getSetting('visualizerBarCount')
  }),
  setVisualizer: async (s: { colorMode?: string; barCount?: number }) => {
    if (s.colorMode)
      await settings.setSetting('visualizerColorMode', s.colorMode as 'heatmap' | 'rainbow' | 'gradient')
    if (s.barCount) await settings.setSetting('visualizerBarCount', s.barCount)
  },

  // ── Display management ─────────────────────────────────────────────
  openGameScreen: async (): Promise<void> => {
    const existing = await WebviewWindow.getByLabel(GAME_SCREEN_LABEL)
    if (existing) {
      await existing.setFocus()
      return
    }
    if (engine.getState().phase === GamePhase.Builder) engine.showSplash()
    const win = new WebviewWindow(GAME_SCREEN_LABEL, {
      url: 'src/renderer/game-screen/index.html',
      title: 'TriviaCON',
      width: 1280,
      height: 720
    })
    win.once('tauri://error', (e) => console.error('Game screen window error:', e))
    broadcast()
  },
  toggleGameFullscreen: async (): Promise<boolean> => {
    const win = await WebviewWindow.getByLabel(GAME_SCREEN_LABEL)
    if (!win) return false
    const next = !(await win.isFullscreen())
    await win.setFullscreen(next)
    return next
  },
  toggleGameDarkMode: async () => {
    engine.toggleDarkMode()
    broadcast()
  },

  // ── App info ───────────────────────────────────────────────────────
  platform: detectPlatform()
}

/** Wire up window lifecycle + cross-window handshake. Call once at startup. */
export function initControlPanel(): void {
  // Purge leftover extraction dirs from previous sessions.
  quizFile.cleanupStaleRuntimeDirs()

  // When the game screen comes up, push the current state to it.
  import('@tauri-apps/api/event').then(({ listen }) => {
    listen('game-screen:ready', () => broadcast())
  })

  // Unsaved-changes guard + cleanup on close.
  // Tauri v2 blocks the close while a close-requested listener exists, so we
  // take explicit control: preventDefault() synchronously, then destroy() to
  // actually close. (close() here would re-fire this handler → loop/hang.)
  const win = getCurrentWindow()
  win.onCloseRequested(async (event) => {
    event.preventDefault()
    if (store.isDirty()) {
      const discard = await ask('You have unsaved changes. Close without saving?', {
        title: 'Unsaved changes',
        kind: 'warning'
      })
      if (!discard) return
    }
    try {
      await quizFile.cleanupTempDirs()
    } catch {
      /* best-effort */
    }
    const game = await WebviewWindow.getByLabel(GAME_SCREEN_LABEL)
    await game?.destroy().catch(() => {})
    await win.destroy()
  })
}
