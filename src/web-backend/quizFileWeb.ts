/**
 * Quiz file management for the Tauri/webview build.
 *
 * Web/webview port of src/data/quizFile.ts:
 *   - ZIP I/O via fflate (in-renderer) instead of adm-zip
 *   - filesystem via @tauri-apps/plugin-fs instead of node:fs
 *   - media is extracted to disk under appLocalData/runtime/<uuid>/media so
 *     the Tauri asset protocol (convertFileSrc) can stream it with Range.
 *
 * The pure in-memory document model (quizStore) is reused unchanged.
 */
import { readFile, writeFile, mkdir, remove, readDir, exists } from '@tauri-apps/plugin-fs'
import { appLocalDataDir, join } from '@tauri-apps/api/path'
import { unzipSync, zipSync } from 'fflate'
import {
  type QuizDocument,
  createEmptyDocument,
  getDocument,
  setDocument,
  clearDocument,
  clearDirty,
  getStats as storeGetStats
} from '../data/quizStore'

const JSON_FILENAME = 'quiz.json'
const MEDIA_DIR = 'media'

let quizFilePath: string | null = null
let workDir: string | null = null
let mediaDirAbs: string | null = null
let runtimeRoot: string | null = null
const tempDirs = new Set<string>()

async function getRuntimeRoot(): Promise<string> {
  if (runtimeRoot) return runtimeRoot
  runtimeRoot = await join(await appLocalDataDir(), 'runtime')
  await mkdir(runtimeRoot, { recursive: true }).catch(() => {})
  return runtimeRoot
}

export function getFilePath(): string | null {
  return quizFilePath
}

export function getMediaDir(): string | null {
  return mediaDirAbs
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b
}

function extOf(filename: string): string {
  const i = filename.lastIndexOf('.')
  return i >= 0 ? filename.slice(i + 1) : ''
}

async function setupWorkDir(): Promise<void> {
  workDir = await join(await getRuntimeRoot(), crypto.randomUUID())
  tempDirs.add(workDir)
  mediaDirAbs = await join(workDir, MEDIA_DIR)
  await mkdir(mediaDirAbs, { recursive: true })
}

// ── Create / open ──────────────────────────────────────────────────

export async function newQuiz(path: string): Promise<void> {
  clearDocument()
  await setupWorkDir()
  setDocument(createEmptyDocument())
  quizFilePath = path
  await saveTo(path)
}

export async function openQuiz(path: string): Promise<void> {
  clearDocument()
  const bytes = await readFile(path)
  if (!isZip(bytes)) {
    throw new Error(
      'Unsupported file format. This .tcq file is from an old version of Triviacon. ' +
        'Open it once with v0.9.3 to convert it to the current format, then try again.'
    )
  }

  await setupWorkDir()

  const entries = unzipSync(bytes)
  let docJson: string | null = null
  for (const [name, data] of Object.entries(entries)) {
    if (name.endsWith('/')) continue
    if (name === JSON_FILENAME) {
      docJson = new TextDecoder().decode(data)
    } else if (name.startsWith(MEDIA_DIR + '/')) {
      const rel = name.slice(MEDIA_DIR.length + 1)
      if (rel) await writeFile(await join(mediaDirAbs!, rel), data)
    }
  }

  if (!docJson) throw new Error(`Quiz archive is missing ${JSON_FILENAME}`)
  quizFilePath = path
  setDocument(JSON.parse(docJson) as QuizDocument)
}

// ── Save / Save As ─────────────────────────────────────────────────

export async function saveTo(destPath: string): Promise<void> {
  if (!workDir || !mediaDirAbs) throw new Error('No quiz open')
  const doc = getDocument()
  if (!doc) throw new Error('No quiz document in memory')

  const files: Record<string, Uint8Array> = {
    [JSON_FILENAME]: new TextEncoder().encode(JSON.stringify(doc, null, 2))
  }

  if (await exists(mediaDirAbs)) {
    for (const entry of await readDir(mediaDirAbs)) {
      if (!entry.isFile) continue
      files[`${MEDIA_DIR}/${entry.name}`] = await readFile(await join(mediaDirAbs, entry.name))
    }
  }

  // Media is already compressed; level 0 keeps saves fast.
  const zipped = zipSync(files, { level: 0 })
  await writeFile(destPath, zipped)
  quizFilePath = destPath
  clearDirty()
}

export async function save(): Promise<void> {
  if (!quizFilePath) throw new Error('No file path — use Save As')
  await saveTo(quizFilePath)
}

// ── Media files ────────────────────────────────────────────────────

export async function attachMediaBytes(bytes: Uint8Array, filename: string): Promise<string> {
  if (!mediaDirAbs) throw new Error('No quiz open')
  const ext = extOf(filename)
  const name = ext ? `${crypto.randomUUID()}.${ext}` : crypto.randomUUID()
  await mkdir(mediaDirAbs, { recursive: true }).catch(() => {})
  await writeFile(await join(mediaDirAbs, name), bytes)
  return name
}

export async function attachMediaPath(sourcePath: string, filename: string): Promise<string> {
  return attachMediaBytes(await readFile(sourcePath), filename)
}

export async function removeMedia(mediaPath: string): Promise<void> {
  if (!mediaDirAbs || !mediaPath) return
  try {
    await remove(await join(mediaDirAbs, mediaPath))
  } catch {
    // Already gone — fine
  }
}

// ── Cleanup ────────────────────────────────────────────────────────

export async function cleanupTempDirs(): Promise<void> {
  clearDocument()
  for (const dir of tempDirs) {
    try {
      await remove(dir, { recursive: true })
    } catch {
      // Best-effort
    }
  }
  tempDirs.clear()
  workDir = null
  mediaDirAbs = null
  quizFilePath = null
}

export async function cleanupStaleRuntimeDirs(): Promise<void> {
  try {
    const root = await getRuntimeRoot()
    if (!(await exists(root))) return
    for (const entry of await readDir(root)) {
      try {
        await remove(await join(root, entry.name), { recursive: true })
      } catch {
        // ignore
      }
    }
  } catch {
    // Runtime root unreadable — ignore
  }
}

export function getStats() {
  return storeGetStats()
}
