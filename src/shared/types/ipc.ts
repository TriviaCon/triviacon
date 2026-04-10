import type { GameState } from './state'

export const IPC = {
  // File operations
  FILE_NEW: 'file:new',
  FILE_OPEN: 'file:open',
  FILE_SAVE: 'file:save',
  FILE_SAVE_AS: 'file:saveAs',

  // Quiz content (builder — proxied to SQLite)
  QUIZ_CATEGORIES_ALL: 'quiz:categories:all',
  QUIZ_CATEGORY_BY_ID: 'quiz:category:byId',
  QUIZ_CATEGORY_CREATE: 'quiz:category:create',
  QUIZ_CATEGORY_UPDATE: 'quiz:category:update',
  QUIZ_CATEGORY_REMOVE: 'quiz:category:remove',

  QUIZ_QUESTIONS_BY_CATEGORY: 'quiz:questions:byCategory',
  QUIZ_QUESTION_BY_ID: 'quiz:question:byId',
  QUIZ_QUESTION_CREATE: 'quiz:question:create',
  QUIZ_QUESTION_UPDATE: 'quiz:question:update',
  QUIZ_QUESTION_DELETE: 'quiz:question:delete',

  QUIZ_HINTS_BY_QUESTION: 'quiz:hints:byQuestion',
  QUIZ_HINT_CREATE: 'quiz:hint:create',
  QUIZ_HINT_UPDATE: 'quiz:hint:update',
  QUIZ_HINT_REMOVE: 'quiz:hint:remove',

  QUIZ_META_GET: 'quiz:meta:get',
  QUIZ_META_UPDATE_NAME: 'quiz:meta:updateName',
  QUIZ_META_UPDATE_AUTHOR: 'quiz:meta:updateAuthor',
  QUIZ_META_UPDATE_DATE: 'quiz:meta:updateDate',
  QUIZ_META_UPDATE_LOCATION: 'quiz:meta:updateLocation',
  QUIZ_META_UPDATE_SPLASH: 'quiz:meta:updateSplash',

  QUIZ_STATS: 'quiz:stats',

  // Team management
  GAME_ADD_TEAM: 'game:addTeam',
  GAME_REMOVE_TEAM: 'game:removeTeam',
  GAME_RENAME_TEAM: 'game:renameTeam',
  GAME_UPDATE_SCORE: 'game:updateScore',
  GAME_SET_CURRENT_TEAM: 'game:setCurrentTeam',
  GAME_NEXT_TEAM: 'game:nextTeam',
  GAME_PREV_TEAM: 'game:prevTeam',

  // Screen transitions
  GAME_SHOW_CATEGORIES: 'game:showCategories',
  GAME_SHOW_QUESTIONS: 'game:showQuestions',
  GAME_SHOW_QUESTION: 'game:showQuestion',
  GAME_SHOW_RANKING: 'game:showRanking',

  // Question state
  GAME_TOGGLE_ANSWER: 'game:toggleAnswer',
  GAME_TOGGLE_HINTS: 'game:toggleHints',
  GAME_MARK_USED: 'game:markUsed',

  // State push (main -> both renderers)
  STATE_UPDATE: 'state:update',

  // Display management
  DISPLAY_OPEN_SCREEN: 'display:openScreen',
  DISPLAY_TOGGLE_FULLSCREEN: 'display:toggleFullscreen',

  // Window management
  WINDOW_CLOSE: 'window:close'
} as const

// Payload types

export interface AddTeamPayload {
  name: string
}

export interface RemoveTeamPayload {
  teamId: string
}

export interface RenameTeamPayload {
  teamId: string
  name: string
}

export interface UpdateScorePayload {
  teamId: string
  delta: number
}

export interface ShowQuestionsPayload {
  categoryId: number
}

export interface ShowQuestionPayload {
  questionId: number
}

export type StateUpdatePayload = GameState
