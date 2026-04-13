import sqlite3 from 'sqlite3'
import { type Database, open } from 'sqlite'
import type { Stats } from '@shared/types/quiz'

const dbg = console.log

export let db: Database | null = null

const _new = async (path: string) => {
  dbg('Creating new database', path)
  db = await open({ filename: path, driver: sqlite3.Database })
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
    type TEXT NOT NULL DEFAULT 'single-answer',
    text TEXT,
    media TEXT,
    FOREIGN KEY(categoryId) REFERENCES Categories(id)
  )
`)

  // Create AnswerOptions table
  db.exec(`
  CREATE TABLE IF NOT EXISTS AnswerOptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionId INTEGER,
    text TEXT,
    correct INTEGER NOT NULL DEFAULT 0,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(questionId) REFERENCES Questions(id)
  )
`)
}

const _open = async (path: string) => {
  dbg('Opening new database', path)
  db = await open({ filename: path, driver: sqlite3.Database })
  db.on('trace', dbg)
}

const getFilePath = (): string | null => {
  return db?.config?.filename ?? null
}

const copyTo = async (destPath: string): Promise<void> => {
  const srcPath = getFilePath()
  if (!srcPath) throw new Error('No database open')
  const fs = await import('fs')
  await fs.promises.copyFile(srcPath, destPath)
}

const getStats = async (): Promise<Stats> => {
  if (!db) return { totalQuestions: 0, questionsWithMedia: 0 }

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
  copyTo,
  getFilePath,
  getStats
}
