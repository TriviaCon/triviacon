import { BrowserWindow, ipcMain, dialog } from 'electron'
import { IPC } from '@shared/types/ipc'
import type { AnswerOption, Question } from '@shared/types/quiz'
import { getSetting, setSetting } from '../settings'
import { QUIZ_FILE_FILTER } from '@shared/constants'
import db from '../../data/db'
import * as store from '../../data/quizStore'
import { GameEngine } from '../state/GameEngine'
import { getControlPanelWindow, getGameScreenWindow } from '../windows'

const engine = new GameEngine()

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
  const state = engine.getState()
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
  // ── File operations ──────────────────────────────────────────────

  ipcMain.handle(IPC.FILE_NEW, async () => {
    const result = await dialog.showSaveDialog({
      filters: [QUIZ_FILE_FILTER]
    })
    if (result.canceled || !result.filePath) return null
    try {
      await db.new(result.filePath)
      const quizMeta = store.metaGet()
      const cats = store.categoriesAll()
      const qMap = store.questionCategoryMap()
      engine.loadQuiz(result.filePath, quizMeta, cats, qMap)
      broadcastState()
      return result.filePath
    } catch (err) {
      console.error('FILE_NEW failed:', err)
      throw err
    }
  })

  ipcMain.handle(IPC.FILE_OPEN, async () => {
    const result = await dialog.showOpenDialog({
      filters: [QUIZ_FILE_FILTER],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    try {
      await db.open(filePath)
      const quizMeta = store.metaGet()
      const cats = store.categoriesAll()
      const qMap = store.questionCategoryMap()
      const savedTeams = store.teamsAll()
      engine.loadQuiz(filePath, quizMeta, cats, qMap, savedTeams)
      broadcastState()
      return filePath
    } catch (err) {
      console.error('FILE_OPEN failed:', err)
      throw err
    }
  })

  ipcMain.handle(IPC.FILE_SAVE, async () => {
    try {
      await db.save()
      return true
    } catch (err) {
      console.error('FILE_SAVE failed:', err)
      throw err
    }
  })

  ipcMain.handle(IPC.FILE_SAVE_AS, async () => {
    const result = await dialog.showSaveDialog({
      filters: [QUIZ_FILE_FILTER]
    })
    if (result.canceled || !result.filePath) return null
    try {
      await db.saveTo(result.filePath)
      broadcastState()
      return result.filePath
    } catch (err) {
      console.error('FILE_SAVE_AS failed:', err)
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

  // ── Questions ────────────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_QUESTIONS_BY_CATEGORY, (_, categoryId: number) =>
    store.questionsAllByCategoryId(categoryId)
  )

  ipcMain.handle(IPC.QUIZ_QUESTION_BY_ID, (_, id: number) => store.questionById(id))

  ipcMain.handle(IPC.QUIZ_QUESTION_CREATE, (_, question: Omit<Question, 'id'>) =>
    store.questionCreate(question)
  )

  ipcMain.handle(IPC.QUIZ_QUESTION_UPDATE, (_, id: number, updates: Partial<Omit<Question, 'id'>>) =>
    store.questionUpdate(id, updates)
  )

  ipcMain.handle(IPC.QUIZ_QUESTION_DELETE, (_, id: number) => store.questionDelete(id))

  // ── Answer Options ───────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_ANSWER_OPTIONS_BY_QUESTION, (_, questionId: number) =>
    store.answerOptionsByQuestionId(questionId)
  )

  ipcMain.handle(
    IPC.QUIZ_ANSWER_OPTION_CREATE,
    (_, questionId: number, text?: string, correct?: boolean, sortOrder?: number) =>
      store.answerOptionCreate(questionId, text, correct, sortOrder)
  )

  ipcMain.handle(
    IPC.QUIZ_ANSWER_OPTION_UPDATE,
    (_, id: number, fields: Partial<Omit<AnswerOption, 'id' | 'questionId'>>) =>
      store.answerOptionUpdate(id, fields)
  )

  ipcMain.handle(IPC.QUIZ_ANSWER_OPTION_REMOVE, (_, id: number) => store.answerOptionRemove(id))

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

  // ── Media management ─────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_MEDIA_PICK, async (_, questionId: number) => {
    const result = await dialog.showOpenDialog({
      filters: [
        { name: 'Media', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'mp4', 'webm', 'mov', 'png', 'jpg', 'jpeg', 'gif', 'webp'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const sourcePath = result.filePaths[0]
    const filename = sourcePath.split(/[\\/]/).pop()!
    const mediaPath = await db.attachMedia(sourcePath, filename)
    store.questionUpdate(questionId, { media: mediaPath })
    return mediaPath
  })

  ipcMain.handle(IPC.QUIZ_MEDIA_REMOVE, async (_, questionId: number) => {
    const question = store.questionById(questionId)
    if (question?.media) {
      await db.removeMedia(question.media)
    }
    store.questionUpdate(questionId, { media: null })
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

  // ── Game screen appearance ──────────────────────────────────────

  ipcMain.handle(IPC.GAME_TOGGLE_DARK_MODE, () => {
    engine.toggleDarkMode()
    broadcastState()
  })

  // ── Settings ───────────────────────────────────────────────────

  ipcMain.handle(IPC.SETTINGS_GET_LANGUAGE, () => {
    return getSetting('language')
  })

  ipcMain.handle(IPC.SETTINGS_SET_LANGUAGE, (_, lang: string) => {
    setSetting('language', lang)
    safeSend(getControlPanelWindow(), IPC.SETTINGS_SET_LANGUAGE, lang)
    safeSend(getGameScreenWindow(), IPC.SETTINGS_SET_LANGUAGE, lang)
  })
}
