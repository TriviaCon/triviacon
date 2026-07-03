/**
 * Quiz file management — ZIP archive I/O and media file operations.
 *
 * The quiz document (.tcq) is a ZIP containing:
 *   - quiz.json  — the quiz data (see QuizDocument in quizStore.ts)
 *   - media/     — attached media files (originalname-uuid named)
 */

import { readFile, copyFile, mkdir, rm, writeFile, readdir, access, stat } from 'fs/promises'
import { sanitizeFilename } from '@shared/media'
import { constants, existsSync } from 'fs'
import { join, sep } from 'path'
import { app } from 'electron'
import { getPortableRoot } from '../main/portablePath'
import AdmZip from 'adm-zip'
import { writeZipArchive, type ArchiveEntry, type SaveProgressCallback } from './zipArchive'
import {
  type QuizDocument,
  createEmptyDocument,
  getDocument,
  setDocument,
  clearDocument,
  clearDirty,
  isDirty,
  getStats as storeGetStats
} from './quizStore'
import type { FileOpenProgressPayload } from '@shared/types/ipc'

export type OpenProgressCallback = (event: FileOpenProgressPayload) => void
export type { SaveProgressCallback }

const dbg = app.isPackaged ? (() => {}) : console.log

/**
 * Resolve the runtime root directory.
 * Prefers `<exe dir>/runtime/` for portability (USB drive, cloud folder, etc.).
 * Falls back to `userData/runtime/` when the exe location is not writable
 * (e.g. macOS /Applications, Linux /opt).
 */
async function resolveRuntimeRoot(): Promise<string> {
  const portable = join(getPortableRoot(), 'runtime')
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

const _open = async (path: string, onProgress?: OpenProgressCallback) => {
  dbg('Opening quiz', path)

  clearDocument()

  const fileBuffer = await readFile(path)

  if (!isZipFile(fileBuffer)) {
    throw new Error(
      'Unsupported file format. This .tcq file is from an old version of Triviacon. ' +
        'Open it once with v0.9.3 to convert it to the current format, then try again.'
    )
  }

  workDir = join(await getRuntimeRoot(), crypto.randomUUID())
  tempDirs.add(workDir)
  await mkdir(join(workDir, MEDIA_DIR), { recursive: true })

  const zip = new AdmZip(fileBuffer)

  // Parse quiz.json synchronously — it's tiny even for large quizzes
  const jsonEntry = zip.getEntry(JSON_FILENAME)
  if (!jsonEntry) throw new Error(`Quiz archive is missing ${JSON_FILENAME}`)

  const raw = jsonEntry.getData().toString('utf-8')
  const doc: QuizDocument = JSON.parse(raw)
  if ((doc as { version?: unknown }).version !== 2) {
    throw new Error(
      `Unsupported quiz version (${(doc as { version?: unknown }).version ?? 'unknown'}). ` +
        'This file may have been created with a newer version of Triviacon.'
    )
  }

  onProgress?.({ phase: 'metadata', meta: { name: doc.meta.name, author: doc.meta.author, location: doc.meta.location, date: doc.meta.date } })

  const cats = (doc.categories ?? []).length
  const questions = (doc.questions ?? []).length
  onProgress?.({ phase: 'structure', categoryCount: cats, questionCount: questions })

  // Extract quiz.json first
  await writeFile(join(workDir, JSON_FILENAME), raw, 'utf-8')

  // Extract media files one-by-one so we can report progress
  const mediaEntries = zip.getEntries().filter(e => !e.isDirectory && e.entryName.startsWith(`${MEDIA_DIR}/`))
  const total = mediaEntries.length

  if (total > 0) {
    onProgress?.({ phase: 'extracting', current: 0, total })
    const mediaDir = join(workDir, MEDIA_DIR)
    await mkdir(mediaDir, { recursive: true })
    for (let i = 0; i < mediaEntries.length; i++) {
      const entry = mediaEntries[i]
      const destPath = join(workDir, entry.entryName)
      // Reject paths that escape the media directory (e.g. media/../../etc/passwd)
      if (!destPath.startsWith(mediaDir + sep)) continue
      await writeFile(destPath, entry.getData())
      onProgress?.({ phase: 'extracting', current: i + 1, total })
    }
  }

  quizFilePath = path
  setDocument(doc)
  onProgress?.({ phase: 'done' })
  dbg('Loaded quiz.json')
}

// ── Save / Save As ─────────────────────────────────────────────────

const _saveTo = async (destPath: string, onProgress?: SaveProgressCallback): Promise<void> => {
  if (!workDir) throw new Error('No quiz open')
  const doc = getDocument()
  if (!doc) throw new Error('No quiz document in memory')

  const jsonBuffer = Buffer.from(JSON.stringify(doc, null, 2), 'utf-8')
  await writeFile(join(workDir, JSON_FILENAME), jsonBuffer)

  const entries: ArchiveEntry[] = [
    { name: JSON_FILENAME, buffer: jsonBuffer, size: jsonBuffer.length }
  ]

  const mediaDir = join(workDir, MEDIA_DIR)
  if (existsSync(mediaDir)) {
    for (const name of await readdir(mediaDir)) {
      const full = join(mediaDir, name)
      const s = await stat(full)
      if (s.isFile()) entries.push({ name: `${MEDIA_DIR}/${name}`, path: full, size: s.size })
    }
  }

  await writeZipArchive(destPath, entries, onProgress)

  quizFilePath = destPath
  clearDirty()
  onProgress?.({ phase: 'done' })
}

const _copyTo = async (destPath: string): Promise<void> => {
  await _saveTo(destPath)
}

// ── Media file management ──────────────────────────────────────────

const _attachMedia = async (sourcePath: string, filename: string): Promise<string> => {
  if (!workDir) throw new Error('No quiz open')
  const uuid = crypto.randomUUID()
  const dotIdx = filename.lastIndexOf('.')
  const baseName = dotIdx > 0 ? filename.slice(0, dotIdx) : filename
  const ext = dotIdx > 0 ? filename.slice(dotIdx + 1) : ''
  const sanitized = sanitizeFilename(baseName)
  const mediaFilename = sanitized
    ? ext ? `${sanitized}-${uuid}.${ext}` : `${sanitized}-${uuid}`
    : ext ? `${uuid}.${ext}` : uuid
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
  open: (path: string, onProgress?: OpenProgressCallback) => _open(path, onProgress),
  save: (onProgress?: SaveProgressCallback) => {
    if (!quizFilePath) throw new Error('No file path — use Save As')
    // C1 — nothing changed since the last save: skip the write entirely.
    if (!isDirty()) {
      onProgress?.({ phase: 'clean' })
      return Promise.resolve()
    }
    return _saveTo(quizFilePath, onProgress)
  },
  saveTo: (destPath: string, onProgress?: SaveProgressCallback) => _saveTo(destPath, onProgress),
  copyTo: _copyTo,
  currentPath: () => quizFilePath,
  getFilePath,
  getMediaDir,
  getStats: () => storeGetStats(),
  attachMedia: _attachMedia,
  removeMedia: _removeMedia,
  cleanupTempDirs
}
