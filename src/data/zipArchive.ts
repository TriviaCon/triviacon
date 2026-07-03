/**
 * Streaming ZIP writer for .tcq archives.
 *
 * Kept free of Electron and module state so it can be unit-tested directly.
 * Everything is STORED (no compression): quiz media is already-compressed
 * (png/jpg/mp3) and quiz.json is tiny, so deflating just burns CPU on weak
 * hardware for ~no size gain. Storing also keeps the write streaming and
 * low-RAM regardless of archive size.
 */

import { createWriteStream } from 'fs'
import { rename, unlink, open } from 'fs/promises'
import { ZipArchive } from 'archiver'
import type { FileSaveProgressPayload } from '@shared/types/ipc'

export type SaveProgressCallback = (event: FileSaveProgressPayload) => void

export interface ArchiveEntry {
  /** Path inside the archive, e.g. `quiz.json` or `media/foo.png`. */
  name: string
  /** In-memory content… */
  buffer?: Buffer
  /** …or a source file streamed from disk (mutually exclusive with `buffer`). */
  path?: string
  /** Byte size, used only for progress totals. */
  size: number
}

/** Flush a file's contents to disk so an atomic rename can't expose a partial write. */
async function fsyncFile(path: string): Promise<void> {
  let fh: Awaited<ReturnType<typeof open>> | undefined
  try {
    fh = await open(path, 'r+')
    await fh.sync()
  } catch {
    // fsync is unsupported on some filesystems (e.g. certain network mounts) — best effort.
  } finally {
    await fh?.close()
  }
}

/**
 * Write `entries` to a ZIP at `destPath`. Streams to a sibling temp file and
 * atomically renames over the destination, so a crash or power loss mid-write
 * can never corrupt an existing archive. Reports per-file/byte progress.
 */
export async function writeZipArchive(
  destPath: string,
  entries: ArchiveEntry[],
  onProgress?: SaveProgressCallback
): Promise<void> {
  const totalFiles = entries.length
  const totalBytes = entries.reduce((n, e) => n + e.size, 0)

  onProgress?.({ phase: 'saving', files: 0, totalFiles, bytes: 0, totalBytes })

  const tmpPath = `${destPath}.saving-${crypto.randomUUID()}.tmp`
  try {
    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(tmpPath)
      const archive = new ZipArchive({ store: true })

      output.on('close', resolve)
      output.on('error', reject)
      archive.on('error', reject)
      archive.on('warning', (err) => { if (err.code !== 'ENOENT') reject(err) })
      archive.on('progress', (p) => {
        onProgress?.({
          phase: 'saving',
          files: p.entries.processed,
          totalFiles,
          bytes: p.fs.processedBytes,
          totalBytes
        })
      })

      archive.pipe(output)
      for (const e of entries) {
        if (e.buffer) archive.append(e.buffer, { name: e.name })
        else if (e.path) archive.file(e.path, { name: e.name })
      }
      archive.finalize()
    })

    await fsyncFile(tmpPath)
    await rename(tmpPath, destPath)
  } catch (err) {
    await unlink(tmpPath).catch(() => {})
    throw err
  }
}
