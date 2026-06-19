export type QuestionType = 'multiple-choice' | 'single-answer' | 'list'

export interface Category {
  id: number
  name: string
  questionCount: number
  sortOrder: number
}

export interface Question {
  id: number
  categoryId: number
  type: QuestionType
  text: string
  /** Host-only rich-text notes (anecdotes, fact-checks). Never shown on the game screen. */
  notes?: string
  media: string | null
  audioOnly?: boolean
  answerMedia?: string | null
  answerMediaAudioOnly?: boolean
  sortOrder: number
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
  timerSeconds: number
  /** Splash visual: a media/ filename (image or video). Supersedes `splash`. */
  splashVisual?: string | null
  /** Splash soundtrack: a media/ filename (audio, or a video used audio-only). */
  splashAudio?: string | null
  /** Mute a video in the visual slot (use its own audio when false). */
  splashMuted?: boolean
  /** Loop the splash video (default true). */
  splashLoop?: boolean
  /** Upscale the splash visual to fill the available space (default false). */
  splashGrow?: boolean
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
