import type { AnswerOption, Category, Question, QuizMeta, Team } from './quiz'

export enum GamePhase {
  Idle = 'idle',
  Builder = 'builder',
  Splash = 'splash',
  Categories = 'categories',
  Questions = 'questions',
  Question = 'question',
  Ranking = 'ranking'
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'expired'
export type TimerSoundMode = 'beeps-and-buzz' | 'beeps' | 'buzz' | 'silent'
export type RankingMode = 'regular' | 'final'

export interface TimerState {
  status: TimerStatus
  remaining: number
}

export interface ActiveQuestionState {
  question: Question
  answerOptions: AnswerOption[]
  answerRevealed: boolean
  markedAnswerId: number | null
  revealedOptionIds: number[]
}

export interface GameState {
  phase: GamePhase
  teams: Team[]
  currentTeamId: string | null
  currentCategoryId: number | null
  categoryQuestions: Question[]
  activeQuestion: ActiveQuestionState | null
  revealedAnswers: number[]
  usedQuestions: number[]
  quizMeta: QuizMeta | null
  quizFilePath: string | null
  quizDirty: boolean
  rankingMode: RankingMode
  rankingRevealStep: number
  tiebreakerTeamIds: string[] | null
  categories: Category[]
  questionCategoryMap: Record<number, number>
  gameScreenDarkMode: boolean
  selectedCategoryId: number | null
  selectedQuestionId: number | null
  timer: TimerState
  timerSound: TimerSoundMode
}

export const INITIAL_GAME_STATE: GameState = {
  phase: GamePhase.Idle,
  teams: [],
  currentTeamId: null,
  currentCategoryId: null,
  categoryQuestions: [],
  activeQuestion: null,
  revealedAnswers: [],
  usedQuestions: [],
  quizMeta: null,
  quizFilePath: null,
  quizDirty: false,
  rankingMode: 'regular',
  rankingRevealStep: 0,
  tiebreakerTeamIds: null,
  categories: [],
  questionCategoryMap: {},
  gameScreenDarkMode: false,
  selectedCategoryId: null,
  selectedQuestionId: null,
  timer: { status: 'idle', remaining: 0 },
  timerSound: 'beeps-and-buzz'
}
