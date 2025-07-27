export const sqlite = async (): Promise<typeof import('sqlite3')> => {
  if (typeof window !== 'undefined') {
    return undefined!
  }

  const sqlite3 = await import('sqlite3')
  return sqlite3.default
}

import { type Database, open } from 'sqlite'
import { dbg } from '.'
import { Stats } from '@renderer/types'
import questions from './questions'
import categories from './categories'
import hints from './hints'
import meta from './meta'

export let db: Database | null = null

const _new = async (path: string) => {
  dbg('Creating new database', path)
  db = await open({ filename: path, driver: (await sqlite()).Database })
  db.on('trace', dbg)
  db.exec(`CREATE TABLE IF NOT EXISTS meta(
          key TEXT not null constraint meta_pk primary key,
          value TEXT
  )`)

  // Create Categories table
  db.exec(`
  CREATE TABLE IF NOT EXISTS Categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )
`)

  // Create Questions table
  db.exec(`
  CREATE TABLE IF NOT EXISTS Questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoryId INTEGER,
    text TEXT,
    answer TEXT,
    media TEXT,
    FOREIGN KEY(categoryId) REFERENCES Categories(id)
  )
`)

  // Create Hints table
  db.exec(`
  CREATE TABLE IF NOT EXISTS Hints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionId INTEGER,
    hint TEXT,
    FOREIGN KEY(questionId) REFERENCES Questions(id)
  )
`)
}

const _open = async (path: string) => {
  dbg('Opening new database', path)
  db = await open({ filename: path, driver: (await sqlite()).Database })
  db.on('trace', dbg)
}

const convertJson = async () => {
  const fs = await import('fs')
  const fileContent = JSON.parse(await fs.promises.readFile('mocks/big_mockQuiz.json', 'utf8'))

  if (!db) {
    throw new Error('Database not initialized')
  }

  const { categories } = fileContent

  for (const category of categories) {
    // Insert category
    const categoryStmt = await db.prepare('INSERT INTO Categories (name) VALUES (?)')
    const categoryResult = await categoryStmt.run(category.name)
    const categoryId = categoryResult.lastID

    for (const question of category.questions) {
      // Insert question
      const questionStmt = await db.prepare(
        'INSERT INTO Questions (categoryId, text, answer, media) VALUES (?, ?, ?, ?)'
      )
      const questionResult = await questionStmt.run(
        categoryId,
        question.text,
        question.answer,
        question.media || null
      )
      const questionId = questionResult.lastID

      for (const hint of question.hints) {
        // Insert hint
        const hintStmt = await db.prepare('INSERT INTO Hints (questionId, hint) VALUES (?, ?)')
        await hintStmt.run(questionId, hint)
      }
    }
  }
}

const getStats = async (): Promise<Stats> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  const totalQuestions = await db.get('SELECT COUNT(*) as count FROM Questions')
  const questionsWithMedia = await db.get(
    'SELECT COUNT(*) as count FROM Questions WHERE media IS NOT NULL'
  )

  return {
    totalQuestions: totalQuestions.count,
    questionsWithMedia: questionsWithMedia.count
  }
}

export default {
  new: _new,
  open: _open,
  convertJson,
  getStats,
  questions,
  categories,
  hints,
  meta
}
