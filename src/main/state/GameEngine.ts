import {
  GamePhase,
  INITIAL_GAME_STATE,
  type GameState
} from '@shared/types/state'
import type { AnswerOption, Category, Question, QuizMeta } from '@shared/types/quiz'

function createInitialState(): GameState {
  return { ...INITIAL_GAME_STATE }
}

let nextTeamId = 1

export class GameEngine {
  private state: GameState

  constructor() {
    this.state = createInitialState()
  }

  getState(): GameState {
    return this.state
  }

  // ── Quiz lifecycle ───────────────────────────────────────────

  loadQuiz(filePath: string, meta: QuizMeta, categories: Category[]): void {
    this.state = {
      ...createInitialState(),
      phase: GamePhase.Builder,
      quizFilePath: filePath,
      quizMeta: meta,
      categories
    }
  }

  closeQuiz(): void {
    this.state = createInitialState()
  }

  updateCategories(categories: Category[]): void {
    this.state.categories = categories
  }

  updateMeta(meta: QuizMeta): void {
    this.state.quizMeta = meta
  }

  // ── Team management ──────────────────────────────────────────

  addTeam(name: string): void {
    const id = `t${nextTeamId++}`
    this.state.teams.push({ id, name, score: 0 })
    if (!this.state.currentTeamId) {
      this.state.currentTeamId = id
    }
  }

  removeTeam(teamId: string): void {
    this.state.teams = this.state.teams.filter((t) => t.id !== teamId)
    if (this.state.currentTeamId === teamId) {
      this.state.currentTeamId = this.state.teams[0]?.id ?? null
    }
  }

  renameTeam(teamId: string, name: string): void {
    const team = this.state.teams.find((t) => t.id === teamId)
    if (team) team.name = name
  }

  updateScore(teamId: string, delta: number): void {
    const team = this.state.teams.find((t) => t.id === teamId)
    if (team) team.score += delta
  }

  setCurrentTeam(teamId: string): void {
    if (this.state.teams.some((t) => t.id === teamId)) {
      this.state.currentTeamId = teamId
    }
  }

  nextTeam(): void {
    if (this.state.teams.length === 0) return
    const idx = this.state.teams.findIndex((t) => t.id === this.state.currentTeamId)
    this.state.currentTeamId = this.state.teams[(idx + 1) % this.state.teams.length].id
  }

  prevTeam(): void {
    if (this.state.teams.length === 0) return
    const idx = this.state.teams.findIndex((t) => t.id === this.state.currentTeamId)
    const prev = (idx - 1 + this.state.teams.length) % this.state.teams.length
    this.state.currentTeamId = this.state.teams[prev].id
  }

  // ── Screen transitions ───────────────────────────────────────

  showCategories(): void {
    this.state.phase = GamePhase.Categories
    this.state.currentCategoryId = null
    this.state.categoryQuestions = []
    this.state.activeQuestion = null
  }

  showQuestions(categoryId: number, questions: Question[]): void {
    this.state.phase = GamePhase.Questions
    this.state.currentCategoryId = categoryId
    this.state.categoryQuestions = questions
    this.state.activeQuestion = null
  }

  showQuestion(question: Question, answerOptions: AnswerOption[]): void {
    this.state.phase = GamePhase.Question
    this.state.activeQuestion = {
      question,
      answerOptions,
      answerRevealed: this.state.revealedAnswers.includes(question.id)
    }
  }

  showRanking(): void {
    this.state.phase = GamePhase.Ranking
    this.state.activeQuestion = null
  }

  // ── Question state ───────────────────────────────────────────

  toggleAnswer(questionId: number): void {
    const idx = this.state.revealedAnswers.indexOf(questionId)
    if (idx >= 0) {
      this.state.revealedAnswers.splice(idx, 1)
    } else {
      this.state.revealedAnswers.push(questionId)
    }
    // Update activeQuestion if it matches
    if (this.state.activeQuestion?.question.id === questionId) {
      this.state.activeQuestion.answerRevealed = idx < 0
    }
  }

  markUsed(questionId: number): void {
    if (!this.state.usedQuestions.includes(questionId)) {
      this.state.usedQuestions.push(questionId)
    } else {
      this.state.usedQuestions = this.state.usedQuestions.filter((id) => id !== questionId)
    }
  }
}
