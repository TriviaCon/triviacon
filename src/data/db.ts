/**
 * Quiz file management — ZIP archive I/O and media file operations.
 *
 * The quiz document (.tcq) is a ZIP containing:
 *   - quiz.json  — the quiz data (see QuizDocument in quizStore.ts)
 *   - media/     — attached media files (UUID-named)
 */

import { readFile, copyFile, mkdir, rm, writeFile, readdir, access } from 'fs/promises'
import { constants, existsSync } from 'fs'
import { join, dirname } from 'path'
import { app } from 'electron'
import AdmZip from 'adm-zip'
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
  zip.extractAllTo(workDir, true)

  quizFilePath = path

  const jsonPath = join(workDir, JSON_FILENAME)
  if (!existsSync(jsonPath)) {
    throw new Error(`Quiz archive is missing ${JSON_FILENAME}`)
  }

  const raw = await readFile(jsonPath, 'utf-8')
  const doc: QuizDocument = JSON.parse(raw)
  setDocument(doc)
  dbg('Loaded quiz.json')
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
