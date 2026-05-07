import type { GameState } from './state'

export const IPC = {
  // File operations
  FILE_NEW: 'file:new',
  FILE_OPEN: 'file:open',
  FILE_SAVE: 'file:save',
  FILE_SAVE_AS: 'file:saveAs',

  // Quiz content (builder — proxied to quiz store)
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

  QUIZ_ANSWER_OPTIONS_BY_QUESTION: 'quiz:answerOptions:byQuestion',
  QUIZ_ANSWER_OPTION_CREATE: 'quiz:answerOption:create',
  QUIZ_ANSWER_OPTION_UPDATE: 'quiz:answerOption:update',
  QUIZ_ANSWER_OPTION_REMOVE: 'quiz:answerOption:remove',

  QUIZ_META_GET: 'quiz:meta:get',
  QUIZ_META_UPDATE_NAME: 'quiz:meta:updateName',
  QUIZ_META_UPDATE_AUTHOR: 'quiz:meta:updateAuthor',
  QUIZ_META_UPDATE_DATE: 'quiz:meta:updateDate',
  QUIZ_META_UPDATE_LOCATION: 'quiz:meta:updateLocation',
  QUIZ_META_UPDATE_SPLASH: 'quiz:meta:updateSplash',

  QUIZ_STATS: 'quiz:stats',

  // Media management
  QUIZ_MEDIA_PICK: 'quiz:media:pick',
  QUIZ_MEDIA_REMOVE: 'quiz:media:remove',

  // Team management
  GAME_ADD_TEAM: 'game:addTeam',
  GAME_REMOVE_TEAM: 'game:removeTeam',
  GAME_RENAME_TEAM: 'game:renameTeam',
  GAME_UPDATE_SCORE: 'game:updateScore',
  GAME_SET_CURRENT_TEAM: 'game:setCurrentTeam',
  GAME_NEXT_TEAM: 'game:nextTeam',
  GAME_PREV_TEAM: 'game:prevTeam',

  // Screen transitions
  GAME_SHOW_SPLASH: 'game:showSplash',
  GAME_SHOW_CATEGORIES: 'game:showCategories',
  GAME_SHOW_QUESTIONS: 'game:showQuestions',
  GAME_SHOW_QUESTION: 'game:showQuestion',
  GAME_SHOW_RANKING: 'game:showRanking',

  // Selection (preview before reveal)
  GAME_SELECT_CATEGORY: 'game:selectCategory',
  GAME_SELECT_QUESTION: 'game:selectQuestion',

  // Question state
  GAME_TOGGLE_ANSWER: 'game:toggleAnswer',
  GAME_MARK_USED: 'game:markUsed',
  GAME_MARK_ANSWER: 'game:markAnswer',

  // Media control (control panel -> main -> game screen)
  MEDIA_PLAY: 'media:play',
  MEDIA_PAUSE: 'media:pause',
  MEDIA_STOP: 'media:stop',
  MEDIA_TOGGLE_FULLSCREEN: 'media:toggleFullscreen',

  // Game screen appearance
  GAME_TOGGLE_DARK_MODE: 'game:toggleDarkMode',

  // State push (main -> both renderers)
  STATE_UPDATE: 'state:update',

  // Settings
  SETTINGS_GET_LANGUAGE: 'settings:getLanguage',
  SETTINGS_SET_LANGUAGE: 'settings:setLanguage',

  // Display management
  DISPLAY_OPEN_SCREEN: 'display:openScreen',
  DISPLAY_TOGGLE_FULLSCREEN: 'display:toggleFullscreen'
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
