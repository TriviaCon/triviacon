/// <reference types="vite/client" />

import type { GameState } from '@shared/types/state'
import type { Category, Question, AnswerOption, QuizMeta, Stats } from '@shared/types/quiz'

/**
 * Unified window.api type declaration.
 *
 * The control panel preload exposes the full set; the game screen preload
 * exposes only the read-only subset. Because both renderers live under
 * one tsconfig we declare the superset here. At runtime each window
 * only has the methods its preload script registered.
 */
declare global {
  interface Window {
    api: {
      // --- Shared (both windows) ---
      onStateUpdate: (callback: (state: GameState) => void) => () => void

      // --- File operations (control panel only) ---
      fileNew: () => Promise<string | null>
      fileOpen: () => Promise<string | null>
      fileSave: () => Promise<boolean>
      fileSaveAs: () => Promise<string | null>

      // --- Categories ---
      categoriesAll: () => Promise<Category[]>
      categoryById: (id: number) => Promise<Category | null>
      categoryCreate: (name: string) => Promise<number>
      categoryUpdate: (id: number, name: string) => Promise<void>
      categoryRemove: (id: number) => Promise<void>

      // --- Questions ---
      questionsByCategory: (categoryId: number) => Promise<Question[]>
      questionById: (id: number) => Promise<Question | null>
      questionCreate: (question: Omit<Question, 'id'>) => Promise<number>
      questionUpdate: (id: number, updates: Partial<Omit<Question, 'id'>>) => Promise<void>
      questionDelete: (id: number) => Promise<void>

      // --- Answer Options ---
      answerOptionsByQuestion: (questionId: number) => Promise<AnswerOption[]>
      answerOptionCreate: (
        questionId: number,
        text?: string,
        correct?: boolean,
        sortOrder?: number
      ) => Promise<number>
      answerOptionUpdate: (
        id: number,
        fields: Partial<Omit<AnswerOption, 'id' | 'questionId'>>
      ) => Promise<void>
      answerOptionRemove: (id: number) => Promise<void>

      // --- Meta ---
      quizMetaGet: () => Promise<QuizMeta>
      quizMetaUpdateName: (name: string) => Promise<void>
      quizMetaUpdateAuthor: (author: string) => Promise<void>
      quizMetaUpdateDate: (date: string) => Promise<void>
      quizMetaUpdateLocation: (location: string) => Promise<void>
      quizMetaUpdateSplash: (splash: string) => Promise<void>

      // --- Stats ---
      quizStats: () => Promise<Stats>

      // --- Team management ---
      addTeam: (name: string) => Promise<void>
      removeTeam: (teamId: string) => Promise<void>
      renameTeam: (teamId: string, name: string) => Promise<void>
      updateScore: (teamId: string, delta: number) => Promise<void>
      setCurrentTeam: (teamId: string) => Promise<void>
      nextTeam: () => Promise<void>
      prevTeam: () => Promise<void>

      // --- Screen transitions ---
      showSplash: () => Promise<void>
      showCategories: () => Promise<void>
      showQuestions: (categoryId: number) => Promise<void>
      showQuestion: (questionId: number) => Promise<void>
      showRanking: () => Promise<void>

      // --- Question state ---
      toggleAnswer: (questionId: number) => Promise<void>
      markUsed: (questionId: number) => Promise<void>
      markAnswer: (answerOptionId: number | null) => Promise<void>

      // --- Media management ---
      mediaPickFile: (questionId: number) => Promise<string | null>
      mediaRemoveFile: (questionId: number) => Promise<void>

      // --- Media playback ---
      mediaPlay: () => Promise<void>
      mediaPause: () => Promise<void>
      mediaStop: () => Promise<void>
      mediaToggleFullscreen: () => Promise<void>

      // --- Media playback listeners (game screen only) ---
      onMediaPlay: (callback: () => void) => () => void
      onMediaPause: (callback: () => void) => () => void
      onMediaStop: (callback: () => void) => () => void
      onMediaToggleFullscreen: (callback: () => void) => () => void

      // --- Settings ---
      getLanguage: () => Promise<string>
      setLanguage: (lang: string) => Promise<void>
      onLanguageChange: (callback: (lang: string) => void) => () => void

      // --- Display management (control panel only) ---
      openGameScreen: () => Promise<void>
      toggleGameFullscreen: () => Promise<boolean>
      toggleGameDarkMode: () => Promise<void>

      // --- App info ---
      platform: string
    }
  }
}

export {}
