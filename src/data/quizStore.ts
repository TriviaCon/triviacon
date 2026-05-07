/**
 * In-memory quiz document store.
 *
 * Replaces the SQLite data layer with a plain JSON structure.
 * All operations are synchronous — just array manipulation.
 */

import type {
  Category,
  Question,
  QuestionType,
  AnswerOption,
  QuizMeta,
  Stats,
  Team
} from '@shared/types/quiz'

// ── Document schema ───────────────────────────────────────────────

export interface QuizDocument {
  version: 2
  meta: {
    name: string
    author: string
    location: string
    date: string
    splash: string
  }
  nextIds: {
    category: number
    question: number
    answerOption: number
  }
  categories: Array<{
    id: number
    name: string
  }>
  questions: Array<{
    id: number
    categoryId: number
    type: QuestionType
    text: string
    media: string | null
  }>
  answerOptions: Array<{
    id: number
    questionId: number
    text: string
    correct: boolean
    sortOrder: number
  }>
  teams: Array<{
    id: string
    name: string
    score: number
    sortOrder: number
  }>
}

// ── Module state ──────────────────────────────────────────────────

let doc: QuizDocument | null = null
let dirty = false

export function isDirty(): boolean {
  return dirty
}

export function markDirty(): void {
  dirty = true
}

export function clearDirty(): void {
  dirty = false
}

export function createEmptyDocument(): QuizDocument {
  return {
    version: 2,
    meta: { name: '', author: '', location: '', date: '', splash: '' },
    nextIds: { category: 1, question: 1, answerOption: 1 },
    categories: [],
    questions: [],
    answerOptions: [],
    teams: []
  }
}

export function getDocument(): QuizDocument | null {
  return doc
}

export function setDocument(d: QuizDocument): void {
  doc = d
  dirty = false
}

export function clearDocument(): void {
  doc = null
  dirty = false
}

function requireDoc(): QuizDocument {
  if (!doc) throw new Error('No quiz loaded')
  return doc
}

// ── Categories ────────────────────────────────────────────────────

export function categoriesAll(): Category[] {
  if (!doc) return []
  return doc.categories.map((c) => ({
    id: c.id,
    name: c.name,
    questionCount: doc!.questions.filter((q) => q.categoryId === c.id).length
  }))
}

export function categoryById(id: number): Category | null {
  if (!doc) return null
  const c = doc.categories.find((c) => c.id === id)
  if (!c) return null
  return {
    id: c.id,
    name: c.name,
    questionCount: doc.questions.filter((q) => q.categoryId === c.id).length
  }
}

export function categoryCreate(name: string): number {
  const d = requireDoc()
  const id = d.nextIds.category++
  d.categories.push({ id, name })
  markDirty()
  return id
}

export function categoryUpdate(id: number, name: string): void {
  const d = requireDoc()
  const c = d.categories.find((c) => c.id === id)
  if (c) {
    c.name = name
    markDirty()
  }
}

export function categoryRemove(id: number): void {
  const d = requireDoc()
  const questionIds = d.questions.filter((q) => q.categoryId === id).map((q) => q.id)
  d.answerOptions = d.answerOptions.filter((ao) => !questionIds.includes(ao.questionId))
  d.questions = d.questions.filter((q) => q.categoryId !== id)
  d.categories = d.categories.filter((c) => c.id !== id)
  markDirty()
}

// ── Questions ─────────────────────────────────────────────────────

export function questionsAllByCategoryId(categoryId: number): Question[] {
  if (!doc) return []
  return doc.questions
    .filter((q) => q.categoryId === categoryId)
    .map((q) => ({ ...q }))
}

export function questionById(id: number): Question | null {
  if (!doc) return null
  const q = doc.questions.find((q) => q.id === id)
  return q ? { ...q } : null
}

export function questionCreate(question: Omit<Question, 'id'>): number {
  const d = requireDoc()
  const id = d.nextIds.question++
  d.questions.push({
    id,
    categoryId: question.categoryId,
    type: question.type,
    text: question.text,
    media: question.media
  })
  markDirty()
  return id
}

export function questionUpdate(id: number, updates: Partial<Omit<Question, 'id'>>): void {
  const d = requireDoc()
  const q = d.questions.find((q) => q.id === id)
  if (!q) return
  if (updates.categoryId !== undefined) q.categoryId = updates.categoryId
  if (updates.type !== undefined) q.type = updates.type
  if (updates.text !== undefined) q.text = updates.text
  if (updates.media !== undefined) q.media = updates.media
  markDirty()
}

export function questionDelete(id: number): void {
  const d = requireDoc()
  d.answerOptions = d.answerOptions.filter((ao) => ao.questionId !== id)
  d.questions = d.questions.filter((q) => q.id !== id)
  markDirty()
}

export function questionCategoryMap(): Record<number, number> {
  if (!doc) return {}
  const map: Record<number, number> = {}
  for (const q of doc.questions) map[q.id] = q.categoryId
  return map
}

// ── Answer Options ────────────────────────────────────────────────

export function answerOptionsByQuestionId(questionId: number): AnswerOption[] {
  if (!doc) return []
  return doc.answerOptions
    .filter((ao) => ao.questionId === questionId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((ao) => ({ ...ao }))
}

export function answerOptionCreate(
  questionId: number,
  text: string = '',
  correct: boolean = false,
  sortOrder: number = 0
): number {
  const d = requireDoc()
  const id = d.nextIds.answerOption++
  d.answerOptions.push({ id, questionId, text, correct, sortOrder })
  markDirty()
  return id
}

export function answerOptionUpdate(
  id: number,
  fields: Partial<Omit<AnswerOption, 'id' | 'questionId'>>
): void {
  const d = requireDoc()
  const ao = d.answerOptions.find((ao) => ao.id === id)
  if (!ao) return
  if (fields.text !== undefined) ao.text = fields.text
  if (fields.correct !== undefined) ao.correct = fields.correct
  if (fields.sortOrder !== undefined) ao.sortOrder = fields.sortOrder
  markDirty()
}

export function answerOptionRemove(id: number): void {
  const d = requireDoc()
  d.answerOptions = d.answerOptions.filter((ao) => ao.id !== id)
  markDirty()
}

// ── Meta ──────────────────────────────────────────────────────────

export function metaGet(): QuizMeta {
  if (!doc) return { name: '', author: '', location: '', date: '', splash: '' }
  return { ...doc.meta }
}

export function metaUpdateName(name: string): void {
  requireDoc().meta.name = name
  markDirty()
}
export function metaUpdateAuthor(author: string): void {
  requireDoc().meta.author = author
  markDirty()
}
export function metaUpdateDate(date: string): void {
  requireDoc().meta.date = date
  markDirty()
}
export function metaUpdateLocation(location: string): void {
  requireDoc().meta.location = location
  markDirty()
}
export function metaUpdateSplash(splash: string): void {
  requireDoc().meta.splash = splash
  markDirty()
}

// ── Teams ─────────────────────────────────────────────────────────

export function teamsAll(): Team[] {
  if (!doc) return []
  return doc.teams
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ id, name, score }) => ({ id, name, score }))
}

export function teamsSaveAll(teams: Team[]): void {
  const d = requireDoc()
  d.teams = teams.map((t, i) => ({
    id: t.id,
    name: t.name,
    score: t.score,
    sortOrder: i
  }))
  markDirty()
}

// ── Stats ─────────────────────────────────────────────────────────

export function getStats(): Stats {
  if (!doc) return { totalQuestions: 0, questionsWithMedia: 0 }
  return {
    totalQuestions: doc.questions.length,
    questionsWithMedia: doc.questions.filter((q) => q.media && q.media.length > 0).length
  }
}
