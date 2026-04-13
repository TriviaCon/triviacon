import type { AnswerOption, Category, Question, QuizMeta, Team } from './quiz'

export enum GamePhase {
  Idle = 'idle',
  Builder = 'builder',
  Categories = 'categories',
  Questions = 'questions',
  Question = 'question',
  Ranking = 'ranking'
}

export interface ActiveQuestionState {
  question: Question
  answerOptions: AnswerOption[]
  answerRevealed: boolean
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
  categories: []
}
