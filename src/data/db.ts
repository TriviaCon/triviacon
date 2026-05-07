/**
 * Quiz file management — ZIP archive I/O and media file operations.
 *
 * The quiz document (.tcq) is a ZIP containing:
 *   - quiz.json  — the quiz data (see QuizDocument in quizStore.ts)
 *   - media/     — attached media files (UUID-named)
 *
 * Legacy .tcq files containing a SQLite database (quiz.db) are
 * auto-migrated to JSON on first open via sql.js (WASM, no native deps).
 */

import { readFile, copyFile, mkdir, rm, writeFile, readdir, access } from 'fs/promises'
import { constants, existsSync } from 'fs'
import { join, dirname } from 'path'
import { app } from 'electron'
import AdmZip from 'adm-zip'
import type { Stats, Question } from '@shared/types/quiz'
import {
  type QuizDocument,
  createEmptyDocument,
  getDocument,
  setDocument,
  clearDocument,
  clearDirty,
  getStats as storeGetStats
} from './quizStore'

const dbg = app.isPackaged ? (() => {}) : console.log

/**
 * Resolve the runtime root directory.
 * Prefers `<exe dir>/runtime/` for portability (USB drive, cloud folder, etc.).
 * Falls back to `userData/runtime/` when the exe location is not writable
 * (e.g. macOS /Applications, Linux /opt).
 */
async function resolveRuntimeRoot(): Promise<string> {
  const portable = join(dirname(app.getPath('exe')), 'runtime')
  try {
    await mkdir(portable, { recursive: true })
    await access(portable, constants.W_OK)
    return portable
  } catch {
    return join(app.getPath('userData'), 'runtime')
  }
}

let _runtimeRoot: string | null = null

async function getRuntimeRoot(): Promise<string> {
  if (!_runtimeRoot) _runtimeRoot = await resolveRuntimeRoot()
  return _runtimeRoot
}

const JSON_FILENAME = 'quiz.json'
const LEGACY_DB_FILENAME = 'quiz.db'
const MEDIA_DIR = 'media'

/** Path to the original .tcq file the user opened / saved to. */
let quizFilePath: string | null = null

/** Temp working directory (extracted ZIP contents live here). */
let workDir: string | null = null

/** All temp dirs created during this session, cleaned up on quit. */
const tempDirs: Set<string> = new Set()

// ── Public accessors ───────────────────────────────────────────────

export function getFilePath(): string | null {
  return quizFilePath
}

export function getMediaDir(): string | null {
  if (!workDir) return null
  return join(workDir, MEDIA_DIR)
}

// ── ZIP detection ──────────────────────────────────────────────────

function isZipFile(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b
}

// ── Create new quiz ────────────────────────────────────────────────

const _new = async (path: string) => {
  dbg('Creating new quiz', path)

  clearDocument()

  workDir = join(await getRuntimeRoot(), crypto.randomUUID())
  tempDirs.add(workDir)
  await mkdir(join(workDir, MEDIA_DIR), { recursive: true })

  setDocument(createEmptyDocument())
  quizFilePath = path
  await _saveTo(path)
}

// ── Open existing quiz ─────────────────────────────────────────────

const _open = async (path: string) => {
  dbg('Opening quiz', path)

  clearDocument()

  const fileBuffer = await readFile(path)

  workDir = join(await getRuntimeRoot(), crypto.randomUUID())
  tempDirs.add(workDir)
  await mkdir(join(workDir, MEDIA_DIR), { recursive: true })

  if (isZipFile(fileBuffer)) {
    const zip = new AdmZip(fileBuffer)
    zip.extractAllTo(workDir, true)
  } else {
    // Legacy raw SQLite — copy as quiz.db for migration
    await writeFile(join(workDir, LEGACY_DB_FILENAME), fileBuffer)
  }

  quizFilePath = path

  const jsonPath = join(workDir, JSON_FILENAME)
  const legacyDbPath = join(workDir, LEGACY_DB_FILENAME)

  if (existsSync(jsonPath)) {
    // New format — parse JSON
    const raw = await readFile(jsonPath, 'utf-8')
    const doc: QuizDocument = JSON.parse(raw)
    setDocument(doc)
    dbg('Loaded quiz.json')
  } else if (existsSync(legacyDbPath)) {
    // Legacy SQLite — migrate to JSON
    dbg('Legacy SQLite detected, migrating...')
    const doc = await migrateSqliteToJson(legacyDbPath, join(workDir, MEDIA_DIR))
    setDocument(doc)
    // Write quiz.json so next save uses new format
    await writeFile(jsonPath, JSON.stringify(doc, null, 2), 'utf-8')
    // Remove the old database file from workDir
    await rm(legacyDbPath).catch(() => {})
    // Also clean up any WAL/SHM files
    await rm(legacyDbPath + '-wal').catch(() => {})
    await rm(legacyDbPath + '-shm').catch(() => {})
    dbg('Migration complete.')
  } else {
    throw new Error('Quiz archive contains neither quiz.json nor quiz.db')
  }
}

// ── Save / Save As ─────────────────────────────────────────────────

const _saveTo = async (destPath: string): Promise<void> => {
  if (!workDir) throw new Error('No quiz open')
  const doc = getDocument()
  if (!doc) throw new Error('No quiz document in memory')

  const jsonBuffer = Buffer.from(JSON.stringify(doc, null, 2), 'utf-8')
  await writeFile(join(workDir, JSON_FILENAME), jsonBuffer)

  const zip = new AdmZip()
  zip.addFile(JSON_FILENAME, jsonBuffer)

  // Add media files
  const mediaDir = join(workDir, MEDIA_DIR)
  if (existsSync(mediaDir)) {
    zip.addLocalFolder(mediaDir, MEDIA_DIR)
  }

  zip.writeZip(destPath)
  quizFilePath = destPath
  clearDirty()
}

const _copyTo = async (destPath: string): Promise<void> => {
  await _saveTo(destPath)
}

// ── Media file management ──────────────────────────────────────────

const _attachMedia = async (sourcePath: string, filename: string): Promise<string> => {
  if (!workDir) throw new Error('No quiz open')
  const uuid = crypto.randomUUID()
  const ext = filename.split('.').pop() ?? ''
  const mediaFilename = ext ? `${uuid}.${ext}` : uuid
  const mediaDir = join(workDir, MEDIA_DIR)
  await mkdir(mediaDir, { recursive: true })
  await copyFile(sourcePath, join(mediaDir, mediaFilename))
  return mediaFilename
}

const _removeMedia = async (mediaPath: string): Promise<void> => {
  if (!workDir || !mediaPath) return
  const fullPath = join(workDir, MEDIA_DIR, mediaPath)
  try {
    await rm(fullPath)
  } catch {
    // File already gone — fine
  }
}

// ── SQLite → JSON migration (uses sql.js, zero native deps) ───────

async function migrateSqliteToJson(
  dbPath: string,
  mediaDirPath: string
): Promise<QuizDocument> {
  const initSqlJs = (await import('sql.js')).default
  const SQL = await initSqlJs()
  const fileData = await readFile(dbPath)
  const sqlDb = new SQL.Database(fileData)

  const doc = createEmptyDocument()

  // Helper: run a query and return rows as plain objects
  function query<T = Record<string, unknown>>(sql: string): T[] {
    const stmt = sqlDb.prepare(sql)
    const rows: T[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T)
    }
    stmt.free()
    return rows
  }

  function tableExists(name: string): boolean {
    const stmt = sqlDb.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?')
    stmt.bind([name])
    const found = stmt.step()
    stmt.free()
    return found
  }

  // ── Run legacy migrations inside SQLite before reading ──────────

  // 1. Ensure Teams table exists
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS Teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      sortOrder INTEGER NOT NULL DEFAULT 0
    )
  `)

  // 2. Migrate Hints → AnswerOptions if needed
  const cols = query<{ name: string }>('PRAGMA table_info(Questions)')
  const hasType = cols.some((c) => c.name === 'type')

  if (!hasType) {
    dbg('Migrating legacy schema → AnswerOptions...')

    sqlDb.run("ALTER TABLE Questions ADD COLUMN type TEXT NOT NULL DEFAULT 'multiple-choice'")

    sqlDb.run(`
      CREATE TABLE IF NOT EXISTS AnswerOptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        questionId INTEGER,
        text TEXT,
        correct INTEGER NOT NULL DEFAULT 0,
        sortOrder INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(questionId) REFERENCES Questions(id)
      )
    `)

    if (tableExists('Hints')) {
      sqlDb.run(`
        INSERT INTO AnswerOptions (questionId, text, correct, sortOrder)
        SELECT h.questionId, h.hint,
          CASE WHEN h.hint = q.answer THEN 1 ELSE 0 END,
          (SELECT COUNT(*) FROM Hints h2 WHERE h2.questionId = h.questionId AND h2.id < h.id)
        FROM Hints h
        JOIN Questions q ON h.questionId = q.id
      `)

      sqlDb.run(`
        INSERT INTO AnswerOptions (questionId, text, correct, sortOrder)
        SELECT q.id, q.answer, 1, 0
        FROM Questions q
        WHERE q.answer IS NOT NULL AND q.answer != ''
          AND q.id NOT IN (SELECT DISTINCT questionId FROM Hints)
      `)

      sqlDb.run(`
        UPDATE Questions SET type = 'single-answer'
        WHERE id NOT IN (SELECT DISTINCT questionId FROM Hints)
      `)
    } else {
      sqlDb.run("UPDATE Questions SET type = 'single-answer'")
      sqlDb.run(`
        INSERT INTO AnswerOptions (questionId, text, correct, sortOrder)
        SELECT id, answer, 1, 0 FROM Questions WHERE answer IS NOT NULL AND answer != ''
      `)
    }
  }

  // Ensure AnswerOptions table exists (for quizzes that already have 'type' but may lack the table)
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS AnswerOptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      questionId INTEGER,
      text TEXT,
      correct INTEGER NOT NULL DEFAULT 0,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(questionId) REFERENCES Questions(id)
    )
  `)

  // ── Read all data ───────────────────────────────────────────────

  // Meta
  if (tableExists('meta')) {
    const metaRows = query<{ key: string; value: string }>('SELECT key, value FROM meta')
    for (const row of metaRows) {
      if (row.key in doc.meta) {
        ;(doc.meta as Record<string, string>)[row.key] = row.value ?? ''
      }
    }
  }

  // Categories
  const catRows = query<{ id: number; name: string }>('SELECT id, name FROM Categories')
  doc.categories = catRows.map((r) => ({ id: r.id, name: r.name ?? '' }))

  // Questions
  const qRows = query<{
    id: number
    categoryId: number
    type: string
    text: string
    media: string | null
  }>('SELECT id, categoryId, type, text, media FROM Questions')

  doc.questions = qRows.map((r) => ({
    id: r.id,
    categoryId: r.categoryId,
    type: (r.type || 'single-answer') as Question['type'],
    text: r.text ?? '',
    media: r.media || null
  }))

  // Answer options
  const aoRows = query<{
    id: number
    questionId: number
    text: string
    correct: number
    sortOrder: number
  }>('SELECT id, questionId, text, correct, sortOrder FROM AnswerOptions')

  doc.answerOptions = aoRows.map((r) => ({
    id: r.id,
    questionId: r.questionId,
    text: r.text ?? '',
    correct: !!r.correct,
    sortOrder: r.sortOrder ?? 0
  }))

  // Teams
  const teamRows = query<{
    id: string
    name: string
    score: number
    sortOrder: number
  }>('SELECT id, name, score, sortOrder FROM Teams')

  doc.teams = teamRows.map((r) => ({
    id: r.id,
    name: r.name,
    score: r.score ?? 0,
    sortOrder: r.sortOrder ?? 0
  }))

  // ── Compute nextIds ─────────────────────────────────────────────

  doc.nextIds.category = doc.categories.reduce((max, c) => Math.max(max, c.id), 0) + 1
  doc.nextIds.question = doc.questions.reduce((max, q) => Math.max(max, q.id), 0) + 1
  doc.nextIds.answerOption = doc.answerOptions.reduce((max, ao) => Math.max(max, ao.id), 0) + 1

  // ── Migrate base64-embedded media to files ──────────────────────

  await mkdir(mediaDirPath, { recursive: true })

  for (const q of doc.questions) {
    if (!q.media || !q.media.startsWith('data:')) continue

    try {
      const match = q.media.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) continue

      const mime = match[1]
      const data = Buffer.from(match[2], 'base64')
      const ext = mime.split('/').pop() ?? 'bin'
      const uuid = crypto.randomUUID()
      const filename = `${uuid}.${ext}`

      await writeFile(join(mediaDirPath, filename), data)
      q.media = filename
      dbg(`  Migrated question ${q.id} media → ${filename}`)
    } catch (err) {
      dbg(`  Failed to migrate question ${q.id} media:`, err)
    }
  }

  sqlDb.close()
  return doc
}

// ── Cleanup ────────────────────────────────────────────────────────

export async function cleanupTempDirs(): Promise<void> {
  clearDocument()
  for (const dir of tempDirs) {
    try {
      await rm(dir, { recursive: true, force: true })
    } catch {
      // Best-effort
    }
  }
  tempDirs.clear()
  workDir = null
  quizFilePath = null
}

/**
 * Purge all leftover runtime extraction directories from previous sessions.
 * Call once on app startup, before opening any quiz, to recover from crashes.
 */
export async function cleanupStaleRuntimeDirs(): Promise<void> {
  const root = await getRuntimeRoot()
  if (!existsSync(root)) return
  try {
    const entries = await readdir(root)
    await Promise.all(
      entries.map((entry) =>
        rm(join(root, entry), { recursive: true, force: true }).catch(() => {})
      )
    )
  } catch {
    // Runtime root unreadable — ignore
  }
}

// ── Exports ────────────────────────────────────────────────────────

export default {
  new: _new,
  open: _open,
  save: () => {
    if (!quizFilePath) throw new Error('No file path — use Save As')
    return _saveTo(quizFilePath)
  },
  saveTo: _saveTo,
  copyTo: _copyTo,
  getFilePath,
  getMediaDir,
  getStats: () => storeGetStats(),
  attachMedia: _attachMedia,
  removeMedia: _removeMedia,
  cleanupTempDirs
}
