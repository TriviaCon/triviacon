import { BrowserWindow, ipcMain, dialog } from 'electron'
import { IPC } from '@shared/types/ipc'
import { QUIZ_FILE_FILTER } from '@shared/constants'
import db from '../../data/db'
import categories from '../../data/categories'
import questions from '../../data/questions'
import answerOptions from '../../data/answerOptions'
import meta from '../../data/meta'
import { GameEngine } from '../state/GameEngine'
import { getControlPanelWindow, getGameScreenWindow } from '../windows'

const engine = new GameEngine()

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

export function registerIpcHandlers(): void {
  // ── File operations ──────────────────────────────────────────────

  ipcMain.handle(IPC.FILE_NEW, async () => {
    const result = await dialog.showSaveDialog({
      filters: [QUIZ_FILE_FILTER]
    })
    if (result.canceled || !result.filePath) return null
    try {
      await db.new(result.filePath)
      const quizMeta = await meta.get()
      const cats = await categories.all()
      engine.loadQuiz(result.filePath, quizMeta, cats)
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
      const quizMeta = await meta.get()
      const cats = await categories.all()
      engine.loadQuiz(filePath, quizMeta, cats)
      broadcastState()
      return filePath
    } catch (err) {
      console.error('FILE_OPEN failed:', err)
      throw err
    }
  })

  ipcMain.handle(IPC.FILE_SAVE, () => {
    // Current file is already being written to in-place via SQLite
    return true
  })

  ipcMain.handle(IPC.FILE_SAVE_AS, async () => {
    const result = await dialog.showSaveDialog({
      filters: [QUIZ_FILE_FILTER]
    })
    if (result.canceled || !result.filePath) return null
    try {
      await db.copyTo(result.filePath)
      await db.open(result.filePath)
      const quizMeta = await meta.get()
      const cats = await categories.all()
      engine.loadQuiz(result.filePath, quizMeta, cats)
      broadcastState()
      return result.filePath
    } catch (err) {
      console.error('FILE_SAVE_AS failed:', err)
      throw err
    }
  })

  // ── Categories ───────────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_CATEGORIES_ALL, () => categories.all())

  ipcMain.handle(IPC.QUIZ_CATEGORY_BY_ID, (_, id: number) => categories.byId(id))

  ipcMain.handle(IPC.QUIZ_CATEGORY_CREATE, async (_, name: string) => {
    const id = await categories.create(name)
    engine.updateCategories(await categories.all())
    broadcastState()
    return id
  })

  ipcMain.handle(IPC.QUIZ_CATEGORY_UPDATE, async (_, id: number, name: string) => {
    await categories.update(id, name)
    engine.updateCategories(await categories.all())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_CATEGORY_REMOVE, async (_, id: number) => {
    await categories.remove(id)
    engine.updateCategories(await categories.all())
    broadcastState()
  })

  // ── Questions ────────────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_QUESTIONS_BY_CATEGORY, (_, categoryId: number) =>
    questions.allByCategoryId(categoryId)
  )

  ipcMain.handle(IPC.QUIZ_QUESTION_BY_ID, (_, id: number) => questions.byId(id))

  ipcMain.handle(IPC.QUIZ_QUESTION_CREATE, (_, question) => questions.create(question))

  ipcMain.handle(IPC.QUIZ_QUESTION_UPDATE, (_, id: number, updates) =>
    questions.update(id, updates)
  )

  ipcMain.handle(IPC.QUIZ_QUESTION_DELETE, (_, id: number) => questions.delete(id))

  // ── Answer Options ───────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_ANSWER_OPTIONS_BY_QUESTION, (_, questionId: number) =>
    answerOptions.byQuestionId(questionId)
  )

  ipcMain.handle(
    IPC.QUIZ_ANSWER_OPTION_CREATE,
    (_, questionId: number, text?: string, correct?: boolean, sortOrder?: number) =>
      answerOptions.create(questionId, text, correct, sortOrder)
  )

  ipcMain.handle(IPC.QUIZ_ANSWER_OPTION_UPDATE, (_, id: number, fields) =>
    answerOptions.update(id, fields)
  )

  ipcMain.handle(IPC.QUIZ_ANSWER_OPTION_REMOVE, (_, id: number) => answerOptions.remove(id))

  // ── Meta ─────────────────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_META_GET, () => meta.get())

  ipcMain.handle(IPC.QUIZ_META_UPDATE_NAME, async (_, name: string) => {
    await meta.updateName(name)
    engine.updateMeta(await meta.get())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_META_UPDATE_AUTHOR, async (_, author: string) => {
    await meta.updateAuthor(author)
    engine.updateMeta(await meta.get())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_META_UPDATE_DATE, async (_, date: string) => {
    await meta.updateDate(date)
    engine.updateMeta(await meta.get())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_META_UPDATE_LOCATION, async (_, location: string) => {
    await meta.updateLocation(location)
    engine.updateMeta(await meta.get())
    broadcastState()
  })

  ipcMain.handle(IPC.QUIZ_META_UPDATE_SPLASH, async (_, splash: string) => {
    await meta.updateSplash(splash)
    engine.updateMeta(await meta.get())
    broadcastState()
  })

  // ── Stats ────────────────────────────────────────────────────────

  ipcMain.handle(IPC.QUIZ_STATS, () => db.getStats())

  // ── Team management ──────────────────────────────────────────────

  ipcMain.handle(IPC.GAME_ADD_TEAM, (_, name: string) => {
    engine.addTeam(name)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_REMOVE_TEAM, (_, teamId: string) => {
    engine.removeTeam(teamId)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_RENAME_TEAM, (_, teamId: string, name: string) => {
    engine.renameTeam(teamId, name)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_UPDATE_SCORE, (_, teamId: string, delta: number) => {
    engine.updateScore(teamId, delta)
    broadcastState()
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

  ipcMain.handle(IPC.GAME_SHOW_CATEGORIES, () => {
    engine.showCategories()
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_SHOW_QUESTIONS, async (_, categoryId: number) => {
    const categoryQuestions = await questions.allByCategoryId(categoryId)
    engine.showQuestions(categoryId, categoryQuestions)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_SHOW_QUESTION, async (_, questionId: number) => {
    const question = await questions.byId(questionId)
    if (!question) return
    const opts = await answerOptions.byQuestionId(questionId)
    engine.showQuestion(question, opts)
    broadcastState()
  })

  ipcMain.handle(IPC.GAME_SHOW_RANKING, () => {
    engine.showRanking()
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
}
