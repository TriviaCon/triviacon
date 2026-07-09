import { BrowserWindow, ipcMain, dialog } from 'electron'
import { IPC } from '@shared/types/ipc'
import type { AnswerOption, Question } from '@shared/types/quiz'
import { getSetting, setSetting } from '../settings'
import type { TimerSoundMode } from '@shared/types/state'
import type { FanfareSound } from '../settings'
import { QUIZ_FILE_FILTER, ensureQuizExtension } from '@shared/constants'
import quizFile from '../../data/quizFile'
import * as store from '../../data/quizStore'
import { GameEngine } from '../state/GameEngine'
import { getControlPanelWindow, getGameScreenWindow } from '../windows'

const engine = new GameEngine()
let timerInterval: ReturnType<typeof setInterval> | null = null

// Parent native dialogs to the control panel window. An unparented modal can
// hang the app on Linux, especially when the dialog is cancelled.
function showOpenDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> {
  const parent = getControlPanelWindow()
  return parent ? dialog.showOpenDialog(parent, options) : dialog.showOpenDialog(options)
}

function showSaveDialog(options: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> {
  const parent = getControlPanelWindow()
  return parent ? dialog.showSaveDialog(parent, options) : dialog.showSaveDialog(options)
}

export function getEngine(): GameEngine {
  return engine
}

function safeSend(win: BrowserWindow | null, channel: string, ...args: unknown[]): void {
  try {
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, ...args)
    }
  } catch {
    /* window closing */
  }
}

function broadcastState(): void {
  const state = { ...engine.getState(), quizDirty: store.isDirty() }
  safeSend(getControlPanelWindow(), IPC.STATE_UPDATE, state)
  safeSend(getGameScreenWindow(), IPC.STATE_UPDATE, state)
}

/** Persist teams to the quiz document after any team mutation. */
function persistTeams(): void {
  try {
    store.teamsSaveAll(engine.getState().teams)
  } catch (err) {
    console.error('Failed to persist teams:', err)
  }
}

export function registerIpcHandlers(): void {
  // Initialize engine from persisted settings
  engine.setTimerSound(getSetting('timerSound'))

  // ── File operations ──────────────────────────────────────────────

  ipcMain.handle(IPC.FILE_NEW, async () => {
    const result = await showSaveDialog({
      filters: [QUIZ_FILE_FILTER]
    })
    if (result.canceled || !result.filePath) return null
    const filePath = ensureQuizExtension(result.filePath)
    try {
      await quizFile.new(filePath)
      const quizMeta = store.metaGet()
      const cats = store.categoriesAll()
      const qMap = store.questionCategoryMap()
      engine.loadQuiz(filePath, quizMeta, cats, qMap)
      broadcastState()
      return filePath
    } catch (err) {
      console.error('FILE_NEW failed:', err)
      throw err
    }
  })

  ipcMain.handle(IPC.FILE_OPEN, async () => {
    const result = await showOpenDialog({
      filters: [QUIZ_FILE_FILTER],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const cpWin = getControlPanelWindow()
    try {
      await quizFile.open(filePath, (event) => {
        if (cpWin) safeSend(cpWin, IPC.FILE_OPEN_PROGRESS, event)
      })
      const quizMeta = store.metaGet()
      const cats = store.categoriesAll()
      const qMap = store.questionCategoryMap()
      const savedTeams = store.teamsAll()
      engine.loadQuiz(filePath, quizMeta, cats, qMap, savedTeams)
      broadcastState()
      return filePath
    } catch (err) {
      console.error('FILE_OPEN failed:', err)
      if (cpWin) safeSend(cpWin, IPC.FILE_OPEN_PROGRESS, { phase: 'error', message: err instanceof Error ? err.message : String(err) })
      throw err
    }
  })

  ipcMain.handle(IPC.FILE_SAVE, async () => {
    const cpWin = getControlPanelWindow()
    try {
      await quizFile.save((event) => {
        if (cpWin) safeSend(cpWin, IPC.FILE_SAVE_PROGRESS, event)
      })
      const path = quizFile.currentPath()
      if (path) engine.setQuizFilePath(path)
      broadcastState()
      return true
    } catch (err) {
      console.error('FILE_SAVE failed:', err)
      if (cpWin) safeSend(cpWin, IPC.FILE_SAVE_PROGRESS, { phase: 'error', message: err instanceof Error ? err.message : String(err) })
      throw err
    }
  })

  ipcMain.handle(IPC.FILE_SAVE_AS, async () => {
    const result = await showSaveDialog({
      filters: [QUIZ_FILE_FILTER]
    })
    if (result.canceled || !result.filePath) return null
    const filePath = ensureQuizExtension(result.filePath)
    const cpWin = getControlPanelWindow()
    try {
      await quizFile.saveTo(filePath, (event) => {
        if (cpWin) safeSend(cpWin, IPC.FILE_SAVE_PROGRESS, event)
      })
      engine.setQuizFilePath(filePath)
      broadcastState()
      return filePath
    } catch (err) {
      console.error('FILE_SAVE_AS failed:', err)
      if (cpWin) safeSend(cpWin, IPC.FILE_SAVE_PROGRESS, { phase: 'error', message: err instanceof Error ? err.message : String(err) })
      throw err
    }
  })

  // ── Categories ───────────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_CATEGORIES_ALL, () => store.categoriesAll())

  ipcMain.handle(IPC.QUIZ_CATEGORY_BY_ID, (_, id: number) => store.categoryById(id))

  ipcMain.handle(IPC.QUIZ_CATEGORY_CREATE, (_, name: string) => {
    const id = store.categoryCreate(name)
    engine.updateCategories(store.categoriesAll())
    broadcastState()
    return id
  })

  ipcMain.handle(IPC.QUIZ_CATEGORY_UPDATE, (_, id: number, name: string) => {
    store.categoryUpdate(id, name)
    engine.updateCategories(store.categoriesAll())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_CATEGORY_REMOVE, (_, id: number) => {
    store.categoryRemove(id)
    engine.updateCategories(store.categoriesAll())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_CATEGORIES_REORDER, (_, orderedIds: number[]) => {
    store.categoriesReorder(orderedIds)
    engine.updateCategories(store.categoriesAll())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_CATEGORY_SHUFFLE, (_, categoryId: number) => {
    store.shuffleCategory(categoryId)
    engine.updateQuestionCategoryMap(store.questionCategoryMap())
    broadcastState()
  })

  // ── Questions ────────────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_QUESTIONS_BY_CATEGORY, (_, categoryId: number) =>
    store.questionsAllByCategoryId(categoryId)
  )

  ipcMain.handle(IPC.QUIZ_QUESTION_BY_ID, (_, id: number) => store.questionById(id))

  ipcMain.handle(IPC.QUIZ_QUESTION_CREATE, (_, question: Omit<Question, 'id' | 'sortOrder'>) => {
    const id = store.questionCreate(question)
    broadcastState()
    return id
  })

  ipcMain.handle(IPC.QUIZ_QUESTION_UPDATE, (_, id: number, updates: Partial<Omit<Question, 'id'>>) => {
    store.questionUpdate(id, updates)
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_QUESTION_DELETE, async (_, id: number) => {
    const question = store.questionById(id)
    if (question?.media) {
      await quizFile.removeMedia(question.media)
    }
    if (question?.answerMedia) {
      await quizFile.removeMedia(question.answerMedia)
    }
    store.questionDelete(id)
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_QUESTIONS_REORDER, (_, orderedIds: number[]) => {
    store.questionsReorder(orderedIds)
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_QUESTIONS_BULK_MOVE, (_, questionIds: number[], targetCategoryId: number) => {
    store.questionsBulkMove(questionIds, targetCategoryId)
    engine.updateCategories(store.categoriesAll())
    engine.updateQuestionCategoryMap(store.questionCategoryMap())
    broadcastState()
  })

  // ── Answer Options ───────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_ANSWER_OPTIONS_BY_QUESTION, (_, questionId: number) =>
    store.answerOptionsByQuestionId(questionId)
  )

  ipcMain.handle(
    IPC.QUIZ_ANSWER_OPTION_CREATE,
    (_, questionId: number, text?: string, correct?: boolean, sortOrder?: number) => {
      const id = store.answerOptionCreate(questionId, text, correct, sortOrder)
      broadcastState()
      return id
    }
  )

  ipcMain.handle(
    IPC.QUIZ_ANSWER_OPTION_UPDATE,
    (_, id: number, fields: Partial<Omit<AnswerOption, 'id' | 'questionId'>>) => {
      store.answerOptionUpdate(id, fields)
      broadcastState()
    }
  )

  ipcMain.handle(IPC.QUIZ_ANSWER_OPTION_REMOVE, (_, id: number) => {
    store.answerOptionRemove(id)
    broadcastState()
  })

  // ── Meta ─────────────────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_META_GET, () => store.metaGet())

  ipcMain.handle(IPC.QUIZ_META_UPDATE_NAME, (_, name: string) => {
    store.metaUpdateName(name)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_META_UPDATE_AUTHOR, (_, author: string) => {
    store.metaUpdateAuthor(author)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_META_UPDATE_DATE, (_, date: string) => {
    store.metaUpdateDate(date)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_META_UPDATE_LOCATION, (_, location: string) => {
    store.metaUpdateLocation(location)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_META_UPDATE_SPLASH, (_, splash: string) => {
    store.metaUpdateSplash(splash)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_META_UPDATE_TIMER, (_, timerSeconds: number) => {
    store.metaUpdateTimer(timerSeconds)
    engine.updateMeta(store.metaGet())
    engine.timerReset()
    broadcastState()
  })

  // ── Splash media (two-slot model) ────────────────────────────────

  const IMAGE_VIDEO_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov']
  const AUDIO_VIDEO_EXTS = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'mp4', 'webm', 'mov']

  ipcMain.handle(IPC.SPLASH_PICK_VISUAL, async () => {
    const result = await showOpenDialog({
      filters: [{ name: 'Image or video', extensions: IMAGE_VIDEO_EXTS }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const sourcePath = result.filePaths[0]
    const prev = store.metaGet().splashVisual
    if (prev) await quizFile.removeMedia(prev)
    const filename = sourcePath.split(/[\\/]/).pop()!
    const mediaPath = await quizFile.attachMedia(sourcePath, filename)
    store.metaSetSplashVisual(mediaPath)
    // A video brings its own audio — a separate soundtrack is mutually exclusive.
    if (/\.(mp4|webm|mov)$/i.test(mediaPath)) {
      const prevAudio = store.metaGet().splashAudio
      if (prevAudio) await quizFile.removeMedia(prevAudio)
      store.metaSetSplashAudio(null)
      store.metaSetSplashMuted(false)
    }
    engine.updateMeta(store.metaGet())
    broadcastState()
    return mediaPath
  })

  ipcMain.handle(IPC.SPLASH_PICK_AUDIO, async () => {
    const result = await showOpenDialog({
      filters: [{ name: 'Audio or video', extensions: AUDIO_VIDEO_EXTS }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const sourcePath = result.filePaths[0]
    const prev = store.metaGet().splashAudio
    if (prev) await quizFile.removeMedia(prev)
    const filename = sourcePath.split(/[\\/]/).pop()!
    const mediaPath = await quizFile.attachMedia(sourcePath, filename)
    store.metaSetSplashAudio(mediaPath)
    engine.updateMeta(store.metaGet())
    broadcastState()
    return mediaPath
  })

  ipcMain.handle(IPC.SPLASH_CLEAR_VISUAL, async () => {
    const prev = store.metaGet().splashVisual
    if (prev) await quizFile.removeMedia(prev)
    store.metaSetSplashVisual(null)
    store.metaSetSplashMuted(false)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  ipcMain.handle(IPC.SPLASH_CLEAR_AUDIO, async () => {
    const prev = store.metaGet().splashAudio
    if (prev) await quizFile.removeMedia(prev)
    store.metaSetSplashAudio(null)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  ipcMain.handle(IPC.SPLASH_SET_MUTED, (_, muted: boolean) => {
    store.metaSetSplashMuted(muted)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  ipcMain.handle(IPC.SPLASH_SET_LOOP, (_, loop: boolean) => {
    store.metaSetSplashLoop(loop)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  ipcMain.handle(IPC.SPLASH_SET_GROW, (_, grow: boolean) => {
    store.metaSetSplashGrow(grow)
    engine.updateMeta(store.metaGet())
    broadcastState()
  })

  // ── Media management ─────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_MEDIA_PICK, async (_, questionId: number) => {
    const result = await showOpenDialog({
      filters: [
        { name: 'Media', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'mp4', 'webm', 'mov', 'png', 'jpg', 'jpeg', 'gif', 'webp'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const sourcePath = result.filePaths[0]
    const filename = sourcePath.split(/[\\/]/).pop()!
    const mediaPath = await quizFile.attachMedia(sourcePath, filename)
    store.questionUpdate(questionId, { media: mediaPath })
    broadcastState()
    return mediaPath
  })

  ipcMain.handle(IPC.QUIZ_MEDIA_ATTACH, async (_, questionId: number, filePath: string) => {
    const filename = filePath.split(/[\\/]/).pop()!
    const mediaPath = await quizFile.attachMedia(filePath, filename)
    store.questionUpdate(questionId, { media: mediaPath })
    broadcastState()
    return mediaPath
  })

  ipcMain.handle(IPC.QUIZ_MEDIA_REMOVE, async (_, questionId: number) => {
    const question = store.questionById(questionId)
    if (question?.media) {
      await quizFile.removeMedia(question.media)
    }
    store.questionUpdate(questionId, { media: null })
    broadcastState()
  })

  // ── Answer media management ──────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_ANSWER_MEDIA_PICK, async (_, questionId: number) => {
    const result = await showOpenDialog({
      filters: [
        { name: 'Media', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'mp4', 'webm', 'mov', 'png', 'jpg', 'jpeg', 'gif', 'webp'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const sourcePath = result.filePaths[0]
    const filename = sourcePath.split(/[\\/]/).pop()!
    const mediaPath = await quizFile.attachMedia(sourcePath, filename)
    store.questionUpdate(questionId, { answerMedia: mediaPath })
    broadcastState()
    return mediaPath
  })

  ipcMain.handle(IPC.QUIZ_ANSWER_MEDIA_ATTACH, async (_, questionId: number, filePath: string) => {
    const filename = filePath.split(/[\\/]/).pop()!
    const mediaPath = await quizFile.attachMedia(filePath, filename)
    store.questionUpdate(questionId, { answerMedia: mediaPath })
    broadcastState()
    return mediaPath
  })

  ipcMain.handle(IPC.QUIZ_ANSWER_MEDIA_REMOVE, async (_, questionId: number) => {
    const question = store.questionById(questionId)
    if (question?.answerMedia) {
      await quizFile.removeMedia(question.answerMedia)
    }
    store.questionUpdate(questionId, { answerMedia: null, answerMediaAudioOnly: undefined })
    broadcastState()
  })

  // ── Stats ────────────────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_STATS, () => store.getStats())

  // ── Team management ──────────────────────────────────────────────

  ipcMain.handle(IPC.GAME_ADD_TEAM, (_, name: string) => {
    engine.addTeam(name)
    broadcastState()
    persistTeams()
  })

  ipcMain.handle(IPC.GAME_REMOVE_TEAM, (_, teamId: string) => {
    engine.removeTeam(teamId)
    broadcastState()
    persistTeams()
  })

  ipcMain.handle(IPC.GAME_RENAME_TEAM, (_, teamId: string, name: string) => {
    engine.renameTeam(teamId, name)
    broadcastState()
    persistTeams()
  })

  ipcMain.handle(IPC.GAME_UPDATE_SCORE, (_, teamId: string, delta: number) => {
    engine.updateScore(teamId, delta)
    broadcastState()
    persistTeams()
  })

  ipcMain.handle(IPC.GAME_SET_CURRENT_TEAM, (_, teamId: string) => {
    engine.setCurrentTeam(teamId)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_NEXT_TEAM, () => {
    engine.nextTeam()
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_PREV_TEAM, () => {
    engine.prevTeam()
    broadcastState()
  })

  // ── Screen transitions ───────────────────────────────────────────

  ipcMain.handle(IPC.GAME_SHOW_SPLASH, () => {
    engine.showSplash()
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_SHOW_CATEGORIES, () => {
    engine.showCategories()
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_SHOW_QUESTIONS, (_, categoryId: number) => {
    const categoryQuestions = store.questionsAllByCategoryId(categoryId)
    engine.showQuestions(categoryId, categoryQuestions)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_SHOW_QUESTION, (_, questionId: number) => {
    const question = store.questionById(questionId)
    if (!question) return
    const opts = store.answerOptionsByQuestionId(questionId)
    engine.showQuestion(question, opts)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_SHOW_RANKING, () => {
    engine.showRanking()
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_FINISH_QUIZ, () => {
    engine.finishQuiz()
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_REVEAL_NEXT, () => {
    engine.revealNext()
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_REVEAL_BACK, () => {
    engine.revealBack()
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_SET_TIEBREAKER, (_, teamIds: string[] | null) => {
    engine.setTiebreaker(teamIds)
    broadcastState()
  })

  // ── Selection (preview before reveal) ────────────────────────────

  ipcMain.handle(IPC.GAME_SELECT_CATEGORY, (_, categoryId: number | null) => {
    engine.selectCategory(categoryId)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_SELECT_QUESTION, (_, questionId: number | null) => {
    engine.selectQuestion(questionId)
    broadcastState()
  })

  // ── Question state ───────────────────────────────────────────────

  ipcMain.handle(IPC.GAME_TOGGLE_ANSWER, (_, questionId: number) => {
    engine.toggleAnswer(questionId)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_MARK_USED, (_, questionId: number) => {
    engine.markUsed(questionId)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_MARK_ANSWER, (_, answerOptionId: number | null) => {
    engine.markAnswer(answerOptionId)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_TOGGLE_LIST_OPTION, (_, answerOptionId: number) => {
    engine.toggleListOption(answerOptionId)
    broadcastState()
  })

  // ── Media playback (forward to game screen) ────────────────────

  ipcMain.handle(IPC.MEDIA_PLAY, () => {
    safeSend(getGameScreenWindow(), IPC.MEDIA_PLAY)
  })

  ipcMain.handle(IPC.MEDIA_PAUSE, () => {
    safeSend(getGameScreenWindow(), IPC.MEDIA_PAUSE)
  })

  ipcMain.handle(IPC.MEDIA_STOP, () => {
    safeSend(getGameScreenWindow(), IPC.MEDIA_STOP)
  })

  ipcMain.handle(IPC.MEDIA_TOGGLE_FULLSCREEN, () => {
    safeSend(getGameScreenWindow(), IPC.MEDIA_TOGGLE_FULLSCREEN)
  })

  ipcMain.handle(IPC.MEDIA_SEEK, (_, time: number) => {
    safeSend(getGameScreenWindow(), IPC.MEDIA_SEEK, time)
  })

  ipcMain.handle(IPC.MEDIA_SET_VOLUME, (_, volume: number) => {
    safeSend(getGameScreenWindow(), IPC.MEDIA_SET_VOLUME, volume)
  })

  ipcMain.on(IPC.MEDIA_STATE_UPDATE, (_, payload) => {
    safeSend(getControlPanelWindow(), IPC.MEDIA_STATE_UPDATE, payload)
  })

  // ── Game screen appearance ──────────────────────────────────────

  ipcMain.handle(IPC.GAME_TOGGLE_DARK_MODE, () => {
    engine.toggleDarkMode()
    broadcastState()
  })

  // ── Timer control ───────────────────────────────────────────────

  ipcMain.handle(IPC.TIMER_START, () => {
    engine.timerStart()
    broadcastState()
  })

  ipcMain.handle(IPC.TIMER_PAUSE, () => {
    engine.timerPause()
    broadcastState()
  })

  ipcMain.handle(IPC.TIMER_RESET, () => {
    engine.timerReset()
    broadcastState()
  })

  if (!timerInterval) {
    timerInterval = setInterval(() => {
      if (engine.timerTick()) broadcastState()
    }, 1000)
  }

  // ── Settings ───────────────────────────────────────────────────

  ipcMain.handle(IPC.SETTINGS_GET_LANGUAGE, () => {
    return getSetting('language')
  })

  ipcMain.handle(IPC.SETTINGS_SET_LANGUAGE, (_, lang: string) => {
    setSetting('language', lang)
    safeSend(getControlPanelWindow(), IPC.SETTINGS_SET_LANGUAGE, lang)
    safeSend(getGameScreenWindow(), IPC.SETTINGS_SET_LANGUAGE, lang)
  })

  ipcMain.handle(IPC.SETTINGS_GET_DEFAULT_VOLUME, () => {
    return getSetting('defaultVolume')
  })

  ipcMain.handle(IPC.SETTINGS_SET_DEFAULT_VOLUME, (_, volume: number) => {
    setSetting('defaultVolume', volume)
  })

  ipcMain.handle(IPC.SETTINGS_GET_VISUALIZER, () => {
    return {
      colorMode: getSetting('visualizerColorMode'),
      barCount: getSetting('visualizerBarCount')
    }
  })

  ipcMain.handle(IPC.SETTINGS_SET_VISUALIZER, (_, settings: { colorMode?: string; barCount?: number }) => {
    if (settings.colorMode) setSetting('visualizerColorMode', settings.colorMode as 'heatmap' | 'rainbow' | 'gradient')
    if (settings.barCount) setSetting('visualizerBarCount', settings.barCount)
  })

  ipcMain.handle(IPC.SETTINGS_GET_TIMER_SOUND, () => {
    return getSetting('timerSound')
  })

  ipcMain.handle(IPC.SETTINGS_SET_TIMER_SOUND, (_, mode: TimerSoundMode) => {
    setSetting('timerSound', mode)
    engine.setTimerSound(mode)
    broadcastState()
  })

  ipcMain.handle(IPC.SETTINGS_GET_FANFARE, () => getSetting('fanfareSound'))

  ipcMain.handle(IPC.SETTINGS_SET_FANFARE, (_, sound: FanfareSound) => {
    setSetting('fanfareSound', sound)
  })

  ipcMain.handle(IPC.SETTINGS_GET_THEME, () => getSetting('appTheme'))

  ipcMain.handle(IPC.SETTINGS_SET_THEME, (_, theme: string) => {
    setSetting('appTheme', theme)
  })

  // Synchronous getter used by the preload to avoid FOUC on startup
  ipcMain.on(IPC.SETTINGS_INITIAL_THEME, (event) => {
    event.returnValue = getSetting('appTheme')
  })
}
