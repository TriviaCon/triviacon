import type { Category, Hint, Question, QuizMeta, Team } from './quiz'

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
  hints: Hint[]
  answerRevealed: boolean
  hintsRevealed: boolean
}

export interface GameState {
  phase: GamePhase
  teams: Team[]
  currentTeamId: string | null
  currentCategoryId: number | null
  activeQuestion: ActiveQuestionState | null
  revealedAnswers: number[]
  revealedHints: number[]
  usedQuestions: number[]
  quizMeta: QuizMeta | null
  quizFilePath: string | null
  categories: Category[]
}
