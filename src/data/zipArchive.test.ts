import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, readdir, readFile, open } from 'fs/promises'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import AdmZip from 'adm-zip'
import { writeZipArchive, updateArchiveJson, type ArchiveEntry, type SaveProgressCallback } from './zipArchive'
import type { FileSaveProgressPayload } from '@shared/types/ipc'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tcq-ziptest-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

const collect = (events: FileSaveProgressPayload[]): SaveProgressCallback => (e) => { events.push(e) }

describe('writeZipArchive', () => {
  it('round-trips buffer and file entries', async () => {
    const mediaPath = join(dir, 'pic.png')
    await writeFile(mediaPath, Buffer.from([1, 2, 3, 4, 5]))
    const json = Buffer.from(JSON.stringify({ version: 2 }), 'utf-8')

    const dest = join(dir, 'out.tcq')
    const entries: ArchiveEntry[] = [
      { name: 'quiz.json', buffer: json, size: json.length },
      { name: 'media/pic.png', path: mediaPath, size: 5 }
    ]
    await writeZipArchive(dest, entries)

    const zip = new AdmZip(dest)
    expect(zip.getEntry('quiz.json')?.getData().toString('utf-8')).toBe(json.toString('utf-8'))
    expect([...zip.getEntry('media/pic.png')!.getData()]).toEqual([1, 2, 3, 4, 5])
  })

  it('stores media uncompressed (compression method 0)', async () => {
    const mediaPath = join(dir, 'blob.bin')
    // Highly-compressible content would shrink under deflate; STORE must keep it verbatim.
    await writeFile(mediaPath, Buffer.alloc(2048, 0))

    const dest = join(dir, 'out.tcq')
    await writeZipArchive(dest, [{ name: 'media/blob.bin', path: mediaPath, size: 2048 }])

    const entry = new AdmZip(dest).getEntry('media/blob.bin')!
    // adm-zip exposes the raw compression method: 0 = stored, 8 = deflated.
    expect(entry.header.method).toBe(0)
  })

  it('reports progress with correct totals', async () => {
    const events: FileSaveProgressPayload[] = []
    const json = Buffer.from('{}', 'utf-8')
    const dest = join(dir, 'out.tcq')

    await writeZipArchive(dest, [{ name: 'quiz.json', buffer: json, size: json.length }], collect(events))

    const saving = events.filter((e) => e.phase === 'saving')
    expect(saving.length).toBeGreaterThan(0)
    expect(saving[0]).toMatchObject({ phase: 'saving', totalFiles: 1, totalBytes: json.length })
  })

  it('writes atomically — no temp file remains on success', async () => {
    const dest = join(dir, 'out.tcq')
    await writeZipArchive(dest, [{ name: 'quiz.json', buffer: Buffer.from('{}'), size: 2 }])

    const leftovers = (await readdir(dir)).filter((f) => f.includes('.tmp'))
    expect(leftovers).toEqual([])
    expect(existsSync(dest)).toBe(true)
  })

  it('rejects and leaves an existing archive intact when the write fails', async () => {
    const dest = join(dir, 'out.tcq')
    // Seed a valid existing archive.
    await writeZipArchive(dest, [{ name: 'quiz.json', buffer: Buffer.from('{"v":1}'), size: 7 }])
    const before = await readFile(dest)

    // Force a failure: target a temp path in a directory that does not exist.
    const badDest = join(dir, 'nope', 'out.tcq')
    await expect(
      writeZipArchive(badDest, [{ name: 'quiz.json', buffer: Buffer.from('{"v":2}'), size: 7 }])
    ).rejects.toBeTruthy()

    // The pre-existing archive is untouched, and no temp litter is left behind.
    expect([...(await readFile(dest))]).toEqual([...before])
    const leftovers = (await readdir(dir)).filter((f) => f.includes('.tmp'))
    expect(leftovers).toEqual([])
  })
})

describe('updateArchiveJson (incremental)', () => {
  const buildBase = async (dest: string) => {
    const a = join(dir, 'a.png')
    const b = join(dir, 'b.mp3')
    await writeFile(a, Buffer.from([10, 20, 30]))
    await writeFile(b, Buffer.from([40, 50, 60, 70]))
    await writeZipArchive(dest, [
      { name: 'quiz.json', buffer: Buffer.from('{"v":1}'), size: 7 },
      { name: 'media/a.png', path: a, size: 3 },
      { name: 'media/b.mp3', path: b, size: 4 }
    ])
    return new Map([['media/a.png', 3], ['media/b.mp3', 4]])
  }

  it('updates quiz.json in place while preserving media bytes', async () => {
    const dest = join(dir, 'out.tcq')
    const media = await buildBase(dest)

    const next = Buffer.from(JSON.stringify({ v: 2, note: 'changed' }))
    await updateArchiveJson(dest, 'quiz.json', next, media)

    const zip = new AdmZip(dest)
    expect(zip.getEntry('quiz.json')?.getData().toString('utf-8')).toBe(next.toString('utf-8'))
    expect([...zip.getEntry('media/a.png')!.getData()]).toEqual([10, 20, 30])
    expect([...zip.getEntry('media/b.mp3')!.getData()]).toEqual([40, 50, 60, 70])
    expect(zip.getEntries().filter((e) => !e.isDirectory).length).toBe(3)
  })

  it('survives repeated incremental updates', async () => {
    const dest = join(dir, 'out.tcq')
    const media = await buildBase(dest)

    for (let i = 2; i <= 6; i++) {
      await updateArchiveJson(dest, 'quiz.json', Buffer.from(JSON.stringify({ v: i })), media)
    }
    const zip = new AdmZip(dest)
    expect(JSON.parse(zip.getEntry('quiz.json')!.getData().toString('utf-8'))).toEqual({ v: 6 })
    expect([...zip.getEntry('media/a.png')!.getData()]).toEqual([10, 20, 30])
  })

  it('is crash-safe: a torn append still reads the previous state', async () => {
    const dest = join(dir, 'out.tcq')
    const media = await buildBase(dest)
    // A committed incremental update to v2...
    await updateArchiveJson(dest, 'quiz.json', Buffer.from(JSON.stringify({ v: 2 })), media)

    // ...then simulate a crash during the *next* update by truncating its new EOCD.
    const full = await readFile(dest)
    const beforeThird = full.length
    await updateArchiveJson(dest, 'quiz.json', Buffer.from(JSON.stringify({ v: 3 })), media)
    // Chop off everything appended by the third write (its EOCD included).
    const fd = await open(dest, 'r+')
    await fd.truncate(beforeThird)
    await fd.close()

    // The reader falls back to the last intact EOCD → v2, media intact.
    const zip = new AdmZip(dest)
    expect(JSON.parse(zip.getEntry('quiz.json')!.getData().toString('utf-8'))).toEqual({ v: 2 })
    expect([...zip.getEntry('media/a.png')!.getData()]).toEqual([10, 20, 30])
  })

  it('rejects when the media set changed (added file)', async () => {
    const dest = join(dir, 'out.tcq')
    await buildBase(dest)
    const changed = new Map([['media/a.png', 3], ['media/b.mp3', 4], ['media/c.gif', 9]])
    await expect(
      updateArchiveJson(dest, 'quiz.json', Buffer.from('{"v":2}'), changed)
    ).rejects.toThrow(/media set changed/)
  })

  it('rejects when a media size changed', async () => {
    const dest = join(dir, 'out.tcq')
    await buildBase(dest)
    const changed = new Map([['media/a.png', 999], ['media/b.mp3', 4]])
    await expect(
      updateArchiveJson(dest, 'quiz.json', Buffer.from('{"v":2}'), changed)
    ).rejects.toThrow(/media set changed/)
  })

  it('rejects a non-zip file', async () => {
    const dest = join(dir, 'notzip.tcq')
    await writeFile(dest, Buffer.from('this is definitely not a zip archive'))
    await expect(
      updateArchiveJson(dest, 'quiz.json', Buffer.from('{}'), new Map())
    ).rejects.toThrow(/EOCD not found/)
  })
})
