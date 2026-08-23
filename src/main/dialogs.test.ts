import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join, dirname } from 'path'

// Electron 43 defaults `defaultPath` to Downloads when it isn't supplied, so
// what these tests assert is precisely what we hand the dialog: a remembered
// directory when there is a usable one, and nothing at all when there isn't.
const showOpenDialogMock = vi.fn()
const showSaveDialogMock = vi.fn()

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: (...args: unknown[]) => showOpenDialogMock(...args),
    showSaveDialog: (...args: unknown[]) => showSaveDialogMock(...args)
  }
}))

const store: Record<string, unknown> = {}

vi.mock('./settings', () => ({
  getSetting: (key: string) => store[key] ?? null,
  setSetting: (key: string, value: unknown) => {
    store[key] = value
  }
}))

const { showOpenDialog, showSaveDialog } = await import('./dialogs')

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tcq-dialogtest-'))
  for (const k of Object.keys(store)) delete store[k]
  showOpenDialogMock.mockReset()
  showSaveDialogMock.mockReset()
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

/** The options object the dialog was most recently called with. */
const optsOf = (mock: typeof showOpenDialogMock): Electron.OpenDialogOptions =>
  mock.mock.calls.at(-1)!.at(-1) as Electron.OpenDialogOptions

describe('remembered directory', () => {
  it('passes no defaultPath on first use', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] })

    await showOpenDialog(null, 'quiz', { properties: ['openFile'] })

    expect(optsOf(showOpenDialogMock).defaultPath).toBeUndefined()
  })

  it('reopens the directory of the last picked file', async () => {
    const picked = join(dir, 'night.tcq')
    showOpenDialogMock.mockResolvedValue({ canceled: false, filePaths: [picked] })
    await showOpenDialog(null, 'quiz', {})

    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] })
    await showOpenDialog(null, 'quiz', {})

    expect(optsOf(showOpenDialogMock).defaultPath).toBe(dir)
  })

  it('remembers across dialog kinds within a scope', async () => {
    const saved = join(dir, 'night.tcq')
    showSaveDialogMock.mockResolvedValue({ canceled: false, filePath: saved })
    await showSaveDialog(null, 'quiz', {})

    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] })
    await showOpenDialog(null, 'quiz', {})

    expect(optsOf(showOpenDialogMock).defaultPath).toBe(dir)
  })

  it('discards a directory that no longer exists', async () => {
    const picked = join(dir, 'night.tcq')
    showOpenDialogMock.mockResolvedValue({ canceled: false, filePaths: [picked] })
    await showOpenDialog(null, 'quiz', {})

    // The stick gets unplugged between sessions.
    await rm(dir, { recursive: true, force: true })

    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] })
    await showOpenDialog(null, 'quiz', {})

    expect(optsOf(showOpenDialogMock).defaultPath).toBeUndefined()
  })

  it('does not overwrite the memory when the dialog is cancelled', async () => {
    const picked = join(dir, 'night.tcq')
    showOpenDialogMock.mockResolvedValue({ canceled: false, filePaths: [picked] })
    await showOpenDialog(null, 'quiz', {})

    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] })
    await showOpenDialog(null, 'quiz', {})
    await showOpenDialog(null, 'quiz', {})

    expect(optsOf(showOpenDialogMock).defaultPath).toBe(dir)
  })

  it('keeps quiz and media directories independent', async () => {
    const quizDir = await mkdtemp(join(tmpdir(), 'tcq-quiz-'))
    try {
      showOpenDialogMock.mockResolvedValue({
        canceled: false,
        filePaths: [join(quizDir, 'night.tcq')]
      })
      await showOpenDialog(null, 'quiz', {})

      showOpenDialogMock.mockResolvedValue({
        canceled: false,
        filePaths: [join(dir, 'round1.mp3')]
      })
      await showOpenDialog(null, 'media', {})

      showOpenDialogMock.mockReset()
      showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] })
      await showOpenDialog(null, 'quiz', {})

      expect(optsOf(showOpenDialogMock).defaultPath).toBe(quizDir)
    } finally {
      await rm(quizDir, { recursive: true, force: true })
    }
  })

  it('lets an explicit defaultPath win over the remembered one', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: false, filePaths: [join(dir, 'night.tcq')] })
    await showOpenDialog(null, 'quiz', {})

    showOpenDialogMock.mockReset()
    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] })
    await showOpenDialog(null, 'quiz', { defaultPath: '/somewhere/else' })

    expect(optsOf(showOpenDialogMock).defaultPath).toBe('/somewhere/else')
  })
})

describe('parent window', () => {
  it('parents the dialog to the control panel when there is one', async () => {
    const parent = {} as Electron.BrowserWindow
    showSaveDialogMock.mockResolvedValue({ canceled: true, filePath: undefined })

    await showSaveDialog(parent, 'quiz', {})

    expect(showSaveDialogMock.mock.calls[0][0]).toBe(parent)
    expect(showSaveDialogMock.mock.calls[0]).toHaveLength(2)
  })

  it('falls back to an unparented dialog when there is no window', async () => {
    showSaveDialogMock.mockResolvedValue({ canceled: true, filePath: undefined })

    await showSaveDialog(null, 'quiz', {})

    expect(showSaveDialogMock.mock.calls[0]).toHaveLength(1)
  })
})

describe('what gets stored', () => {
  it('stores the directory, not the file path', async () => {
    const picked = join(dir, 'night.tcq')
    showSaveDialogMock.mockResolvedValue({ canceled: false, filePath: picked })

    await showSaveDialog(null, 'quiz', {})

    expect(store.lastQuizDir).toBe(dirname(picked))
    expect(store.lastQuizDir).not.toBe(picked)
  })
})
