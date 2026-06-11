/// <reference types="vite/client" />

import type { GameState } from '@shared/types/state'
import type { MediaPlaybackState, FileOpenProgressPayload } from '@shared/types/ipc'
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
      onCloseRequest: (cb: () => void) => () => void
      closeRespond: (choice: 'save' | 'saveAs' | 'discard' | 'cancel') => Promise<void>

      // --- File operations (control panel only) ---
      fileNew: () => Promise<string | null>
      fileOpen: () => Promise<string | null>
      onOpenProgress: (callback: (event: FileOpenProgressPayload) => void) => () => void
      fileSave: () => Promise<boolean>
      fileSaveAs: () => Promise<string | null>

      // --- Categories ---
      categoriesAll: () => Promise<Category[]>
      categoryById: (id: number) => Promise<Category | null>
      categoryCreate: (name: string) => Promise<number>
      categoryUpdate: (id: number, name: string) => Promise<void>
      categoryRemove: (id: number) => Promise<void>
      categoriesReorder: (orderedIds: number[]) => Promise<void>
      categoryShuffle: (categoryId: number) => Promise<void>

      // --- Questions ---
      questionsByCategory: (categoryId: number) => Promise<Question[]>
      questionById: (id: number) => Promise<Question | null>
      questionCreate: (question: Omit<Question, 'id' | 'sortOrder'>) => Promise<number>
      questionUpdate: (id: number, updates: Partial<Omit<Question, 'id'>>) => Promise<void>
      questionDelete: (id: number) => Promise<void>
      questionsReorder: (orderedIds: number[]) => Promise<void>
      questionsBulkMove: (questionIds: number[], targetCategoryId: number) => Promise<void>

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
      quizMetaUpdateTimer: (timerSeconds: number) => Promise<void>

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
      finishQuiz: () => Promise<void>
      revealNext: () => Promise<void>
      revealBack: () => Promise<void>
      setTiebreaker: (teamIds: string[] | null) => Promise<void>

      // --- Selection (preview before reveal) ---
      selectCategory: (id: number | null) => Promise<void>
      selectQuestion: (id: number | null) => Promise<void>

      // --- Question state ---
      toggleAnswer: (questionId: number) => Promise<void>
      markUsed: (questionId: number) => Promise<void>
      markAnswer: (answerOptionId: number | null) => Promise<void>
      toggleListOption: (answerOptionId: number) => Promise<void>

      // --- Media management ---
      getFilePath: (file: File) => string
      mediaPickFile: (questionId: number) => Promise<string | null>
      mediaAttachFile: (questionId: number, filePath: string) => Promise<string>
      mediaRemoveFile: (questionId: number) => Promise<void>

      // --- Media playback ---
      mediaPlay: () => Promise<void>
      mediaPause: () => Promise<void>
      mediaStop: () => Promise<void>
      mediaToggleFullscreen: () => Promise<void>
      mediaSeek: (time: number) => Promise<void>
      mediaSetVolume: (volume: number) => Promise<void>
      onMediaStateUpdate: (callback: (state: MediaPlaybackState) => void) => () => void

      // --- Media playback listeners (game screen only) ---
      onMediaPlay: (callback: () => void) => () => void
      onMediaPause: (callback: () => void) => () => void
      onMediaStop: (callback: () => void) => () => void
      onMediaToggleFullscreen: (callback: () => void) => () => void
      onMediaSeek: (callback: (time: number) => void) => () => void
      onMediaSetVolume: (callback: (volume: number) => void) => () => void
      sendMediaState: (state: MediaPlaybackState) => void

      // --- Settings ---
      getLanguage: () => Promise<string>
      setLanguage: (lang: string) => Promise<void>
      onLanguageChange: (callback: (lang: string) => void) => () => void
      getDefaultVolume: () => Promise<number>
      setDefaultVolume: (volume: number) => Promise<void>
      getVisualizer: () => Promise<{ colorMode: string; barCount: number }>
      setVisualizer: (settings: { colorMode?: string; barCount?: number }) => Promise<void>

      // --- Display management (control panel only) ---
      openGameScreen: () => Promise<void>
      toggleGameFullscreen: () => Promise<boolean>
      toggleGameDarkMode: () => Promise<void>

      getTimerSound: () => Promise<string>
      setTimerSound: (mode: string) => Promise<void>
      getFanfare: () => Promise<string>
      setFanfare: (sound: string) => Promise<void>
      getTheme: () => Promise<string>
      setTheme: (theme: string) => Promise<void>
      initialTheme: string

      timerStart: () => Promise<void>
      timerPause: () => Promise<void>
      timerReset: () => Promise<void>

      // --- App info ---
      platform: string
    }
  }
}

export {}
