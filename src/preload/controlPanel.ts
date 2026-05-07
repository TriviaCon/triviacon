import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/types/ipc'
import type { GameState } from '@shared/types/state'
import type { Category, Question, AnswerOption, QuizMeta, Stats } from '@shared/types/quiz'

/** Subscribe to an IPC event carrying a single payload. Returns an unsubscribe function. */
function subscribeWith<T>(channel: string, callback: (payload: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api = {
  // ── State subscription ─────────────────────────────────────────
  onStateUpdate: (cb: (state: GameState) => void) => subscribeWith<GameState>(IPC.STATE_UPDATE, cb),

  // ── File operations ────────────────────────────────────────────
  fileNew: (): Promise<string | null> => ipcRenderer.invoke(IPC.FILE_NEW),
  fileOpen: (): Promise<string | null> => ipcRenderer.invoke(IPC.FILE_OPEN),
  fileSave: (): Promise<boolean> => ipcRenderer.invoke(IPC.FILE_SAVE),
  fileSaveAs: (): Promise<string | null> => ipcRenderer.invoke(IPC.FILE_SAVE_AS),

  // ── Categories ─────────────────────────────────────────────────
  categoriesAll: (): Promise<Category[]> => ipcRenderer.invoke(IPC.QUIZ_CATEGORIES_ALL),
  categoryById: (id: number): Promise<Category | null> =>
    ipcRenderer.invoke(IPC.QUIZ_CATEGORY_BY_ID, id),
  categoryCreate: (name: string): Promise<number> =>
    ipcRenderer.invoke(IPC.QUIZ_CATEGORY_CREATE, name),
  categoryUpdate: (id: number, name: string): Promise<void> =>
    ipcRenderer.invoke(IPC.QUIZ_CATEGORY_UPDATE, id, name),
  categoryRemove: (id: number): Promise<void> => ipcRenderer.invoke(IPC.QUIZ_CATEGORY_REMOVE, id),

  // ── Questions ──────────────────────────────────────────────────
  questionsByCategory: (categoryId: number): Promise<Question[]> =>
    ipcRenderer.invoke(IPC.QUIZ_QUESTIONS_BY_CATEGORY, categoryId),
  questionById: (id: number): Promise<Question | null> =>
    ipcRenderer.invoke(IPC.QUIZ_QUESTION_BY_ID, id),
  questionCreate: (question: Omit<Question, 'id'>): Promise<number> =>
    ipcRenderer.invoke(IPC.QUIZ_QUESTION_CREATE, question),
  questionUpdate: (id: number, updates: Partial<Omit<Question, 'id'>>): Promise<void> =>
    ipcRenderer.invoke(IPC.QUIZ_QUESTION_UPDATE, id, updates),
  questionDelete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.QUIZ_QUESTION_DELETE, id),

  // ── Answer Options ─────────────────────────────────────────────
  answerOptionsByQuestion: (questionId: number): Promise<AnswerOption[]> =>
    ipcRenderer.invoke(IPC.QUIZ_ANSWER_OPTIONS_BY_QUESTION, questionId),
  answerOptionCreate: (
    questionId: number,
    text?: string,
    correct?: boolean,
    sortOrder?: number
  ): Promise<number> =>
    ipcRenderer.invoke(IPC.QUIZ_ANSWER_OPTION_CREATE, questionId, text, correct, sortOrder),
  answerOptionUpdate: (
    id: number,
    fields: Partial<Omit<AnswerOption, 'id' | 'questionId'>>
  ): Promise<void> => ipcRenderer.invoke(IPC.QUIZ_ANSWER_OPTION_UPDATE, id, fields),
  answerOptionRemove: (id: number): Promise<void> =>
    ipcRenderer.invoke(IPC.QUIZ_ANSWER_OPTION_REMOVE, id),

  // ── Meta ───────────────────────────────────────────────────────
  quizMetaGet: (): Promise<QuizMeta> => ipcRenderer.invoke(IPC.QUIZ_META_GET),
  quizMetaUpdateName: (name: string): Promise<void> =>
    ipcRenderer.invoke(IPC.QUIZ_META_UPDATE_NAME, name),
  quizMetaUpdateAuthor: (author: string): Promise<void> =>
    ipcRenderer.invoke(IPC.QUIZ_META_UPDATE_AUTHOR, author),
  quizMetaUpdateDate: (date: string): Promise<void> =>
    ipcRenderer.invoke(IPC.QUIZ_META_UPDATE_DATE, date),
  quizMetaUpdateLocation: (location: string): Promise<void> =>
    ipcRenderer.invoke(IPC.QUIZ_META_UPDATE_LOCATION, location),
  quizMetaUpdateSplash: (splash: string): Promise<void> =>
    ipcRenderer.invoke(IPC.QUIZ_META_UPDATE_SPLASH, splash),

  // ── Stats ──────────────────────────────────────────────────────
  quizStats: (): Promise<Stats> => ipcRenderer.invoke(IPC.QUIZ_STATS),

  // ── Team management ─────────────────────────────────────────────
  addTeam: (name: string): Promise<void> => ipcRenderer.invoke(IPC.GAME_ADD_TEAM, name),
  removeTeam: (teamId: string): Promise<void> => ipcRenderer.invoke(IPC.GAME_REMOVE_TEAM, teamId),
  renameTeam: (teamId: string, name: string): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_RENAME_TEAM, teamId, name),
  updateScore: (teamId: string, delta: number): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_UPDATE_SCORE, teamId, delta),
  setCurrentTeam: (teamId: string): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_SET_CURRENT_TEAM, teamId),
  nextTeam: (): Promise<void> => ipcRenderer.invoke(IPC.GAME_NEXT_TEAM),
  prevTeam: (): Promise<void> => ipcRenderer.invoke(IPC.GAME_PREV_TEAM),

  // ── Screen transitions ─────────────────────────────────────────
  showSplash: (): Promise<void> => ipcRenderer.invoke(IPC.GAME_SHOW_SPLASH),
  showCategories: (): Promise<void> => ipcRenderer.invoke(IPC.GAME_SHOW_CATEGORIES),
  showQuestions: (categoryId: number): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_SHOW_QUESTIONS, categoryId),
  showQuestion: (questionId: number): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_SHOW_QUESTION, questionId),
  showRanking: (): Promise<void> => ipcRenderer.invoke(IPC.GAME_SHOW_RANKING),

  // ── Selection (preview before reveal) ──────────────────────────
  selectCategory: (id: number | null): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_SELECT_CATEGORY, id),
  selectQuestion: (id: number | null): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_SELECT_QUESTION, id),

  // ── Question state ─────────────────────────────────────────────
  toggleAnswer: (questionId: number): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_TOGGLE_ANSWER, questionId),
  markUsed: (questionId: number): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_MARK_USED, questionId),
  markAnswer: (answerOptionId: number | null): Promise<void> =>
    ipcRenderer.invoke(IPC.GAME_MARK_ANSWER, answerOptionId),

  // ── Media management ───────────────────────────────────────────
  mediaPickFile: (questionId: number): Promise<string | null> =>
    ipcRenderer.invoke(IPC.QUIZ_MEDIA_PICK, questionId),
  mediaRemoveFile: (questionId: number): Promise<void> =>
    ipcRenderer.invoke(IPC.QUIZ_MEDIA_REMOVE, questionId),

  // ── Media playback ─────────────────────────────────────────────
  mediaPlay: (): Promise<void> => ipcRenderer.invoke(IPC.MEDIA_PLAY),
  mediaPause: (): Promise<void> => ipcRenderer.invoke(IPC.MEDIA_PAUSE),
  mediaStop: (): Promise<void> => ipcRenderer.invoke(IPC.MEDIA_STOP),
  mediaToggleFullscreen: (): Promise<void> => ipcRenderer.invoke(IPC.MEDIA_TOGGLE_FULLSCREEN),

  // ── Settings ───────────────────────────────────────────────────
  getLanguage: (): Promise<string> => ipcRenderer.invoke(IPC.SETTINGS_GET_LANGUAGE),
  setLanguage: (lang: string): Promise<void> => ipcRenderer.invoke(IPC.SETTINGS_SET_LANGUAGE, lang),
  onLanguageChange: (cb: (lang: string) => void) =>
    subscribeWith<string>(IPC.SETTINGS_SET_LANGUAGE, cb),

  // ── Display management ─────────────────────────────────────────
  openGameScreen: (): Promise<void> => ipcRenderer.invoke(IPC.DISPLAY_OPEN_SCREEN),
  toggleGameFullscreen: (): Promise<boolean> => ipcRenderer.invoke(IPC.DISPLAY_TOGGLE_FULLSCREEN),
  toggleGameDarkMode: (): Promise<void> => ipcRenderer.invoke(IPC.GAME_TOGGLE_DARK_MODE),

  // ── App info ───────────────────────────────────────────────────
  platform: process.platform as string
}

export type ControlPanelApi = typeof api

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error fallback for non-isolated context
  window.api = api
}
