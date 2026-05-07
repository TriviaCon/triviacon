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

export interface ActiveQuestionState {
  question: Question
  answerOptions: AnswerOption[]
  answerRevealed: boolean
  markedAnswerId: number | null
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
  categories: Category[]
  questionCategoryMap: Record<number, number>
  gameScreenDarkMode: boolean
  selectedCategoryId: number | null
  selectedQuestionId: number | null
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
  categories: [],
  questionCategoryMap: {},
  gameScreenDarkMode: false,
  selectedCategoryId: null,
  selectedQuestionId: null
}
