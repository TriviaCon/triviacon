export type Uuid = string

export type Category = {
  id: number
  name: string
}

export type Question = {
  id: number
  text: string
  answer: string
  media: string | null
}

export type Stats = {
  totalQuestions: number
  questionsWithMedia: number
}

export interface Hint {
  id: number
  questionId: number
  hint: string
}
