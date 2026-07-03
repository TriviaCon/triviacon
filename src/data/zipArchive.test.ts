import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, readdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import AdmZip from 'adm-zip'
import { writeZipArchive, type ArchiveEntry, type SaveProgressCallback } from './zipArchive'
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
