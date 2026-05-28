export type QuestionType = 'multiple-choice' | 'single-answer' | 'list'

export interface Category {
  id: number
  name: string
  questionCount: number
}

export interface Question {
  id: number
  categoryId: number
  type: QuestionType
  text: string
  media: string | null
  audioOnly?: boolean
}

export interface AnswerOption {
  id: number
  questionId: number
  text: string
  correct: boolean
  sortOrder: number
}

export interface QuizMeta {
  name: string
  author: string
  location: string
  date: string
  splash: string
}

export interface Stats {
  totalQuestions: number
  questionsWithMedia: number
}

export interface Team {
  id: string
  name: string
  score: number
}
