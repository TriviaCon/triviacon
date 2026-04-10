export interface Category {
  id: number
  name: string
}

export interface Question {
  id: number
  text: string
  answer: string
  media: string | null
  categoryId: number
}

export interface Hint {
  id: number
  questionId: number
  hint: string
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
