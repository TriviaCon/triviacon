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

// ── Incremental (append-only) update ───────────────────────────────
//
// When only quiz.json changed and the media set is unchanged, we avoid
// rewriting the (potentially hundreds of MB of) media entirely. Instead we
// append a fresh quiz.json local entry plus a new central directory + EOCD at
// the end of the existing archive, reusing the media entries' bytes in place.
//
// This is crash-safe: ZIP readers locate the End Of Central Directory by
// scanning *backward* from EOF. We only ever append — the original
// [0, fileSize) bytes are never touched — so a torn write leaves the previous
// EOCD as the last valid one, and the archive still reads its prior state.

const LFH_SIG = 0x04034b50
const CDH_SIG = 0x02014b50
const EOCD_SIG = 0x06054b50
const ZIP64_MARK = 0xffffffff
const DOS_EPOCH_DATE = 0x21 // 1980-01-01, the minimum valid DOS date

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

interface CentralRecord {
  name: string
  compressedSize: number
  uncompressedSize: number
  raw: Buffer
}

/** Locate and parse the End Of Central Directory record from a file tail. */
function findEocd(tail: Buffer): { cdOffset: number; cdSize: number; count: number } {
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail.readUInt32LE(i) !== EOCD_SIG) continue
    const commentLen = tail.readUInt16LE(i + 20)
    if (i + 22 + commentLen !== tail.length) continue // trailing bytes — not the real EOCD
    return {
      count: tail.readUInt16LE(i + 10),
      cdSize: tail.readUInt32LE(i + 12),
      cdOffset: tail.readUInt32LE(i + 16)
    }
  }
  throw new Error('EOCD not found — not a supported ZIP')
}

function parseCentralDirectory(cd: Buffer, count: number): CentralRecord[] {
  const records: CentralRecord[] = []
  let p = 0
  for (let n = 0; n < count; n++) {
    if (cd.readUInt32LE(p) !== CDH_SIG) throw new Error('Bad central directory header')
    const compressedSize = cd.readUInt32LE(p + 20)
    const uncompressedSize = cd.readUInt32LE(p + 24)
    const nameLen = cd.readUInt16LE(p + 28)
    const extraLen = cd.readUInt16LE(p + 30)
    const commentLen = cd.readUInt16LE(p + 32)
    const localHeaderOffset = cd.readUInt32LE(p + 42)
    if (compressedSize === ZIP64_MARK || uncompressedSize === ZIP64_MARK || localHeaderOffset === ZIP64_MARK) {
      throw new Error('zip64 entry — unsupported for incremental update')
    }
    const recLen = 46 + nameLen + extraLen + commentLen
    records.push({
      name: cd.toString('utf-8', p + 46, p + 46 + nameLen),
      compressedSize,
      uncompressedSize,
      raw: Buffer.from(cd.subarray(p, p + recLen))
    })
    p += recLen
  }
  return records
}

function buildLocalHeader(name: string, crc: number, size: number): Buffer {
  const nameBuf = Buffer.from(name, 'utf-8')
  const h = Buffer.alloc(30 + nameBuf.length)
  h.writeUInt32LE(LFH_SIG, 0)
  h.writeUInt16LE(20, 4)             // version needed
  h.writeUInt16LE(0, 8)              // method = store
  h.writeUInt16LE(DOS_EPOCH_DATE, 12)
  h.writeUInt32LE(crc, 14)
  h.writeUInt32LE(size, 18)          // compressed
  h.writeUInt32LE(size, 22)          // uncompressed
  h.writeUInt16LE(nameBuf.length, 26)
  nameBuf.copy(h, 30)
  return h
}

function buildCentralRecord(name: string, crc: number, size: number, offset: number): Buffer {
  const nameBuf = Buffer.from(name, 'utf-8')
  const h = Buffer.alloc(46 + nameBuf.length)
  h.writeUInt32LE(CDH_SIG, 0)
  h.writeUInt16LE(20, 4)             // version made by
  h.writeUInt16LE(20, 6)             // version needed
  h.writeUInt16LE(0, 10)            // method = store
  h.writeUInt16LE(DOS_EPOCH_DATE, 14)
  h.writeUInt32LE(crc, 16)
  h.writeUInt32LE(size, 20)
  h.writeUInt32LE(size, 24)
  h.writeUInt16LE(nameBuf.length, 28)
  h.writeUInt32LE(offset, 42)        // local header offset
  nameBuf.copy(h, 46)
  return h
}

function buildEocd(count: number, cdSize: number, cdOffset: number): Buffer {
  const e = Buffer.alloc(22)
  e.writeUInt32LE(EOCD_SIG, 0)
  e.writeUInt16LE(count, 8)
  e.writeUInt16LE(count, 10)
  e.writeUInt32LE(cdSize, 12)
  e.writeUInt32LE(cdOffset, 16)
  return e
}

/**
 * Replace `jsonName` inside an existing archive by appending, without touching
 * the media payload. Throws (so the caller can fall back to a full rewrite) if
 * the archive isn't safely updatable in place: media set changed, zip64 is
 * involved, offsets would overflow 32-bit, or dead bytes have accumulated
 * enough that a compacting rewrite is worthwhile.
 *
 * `expectedMedia` maps in-archive entry names (e.g. `media/foo.png`) to their
 * uncompressed byte size, used to confirm the media set is unchanged.
 */
export async function updateArchiveJson(
  archivePath: string,
  jsonName: string,
  jsonBuffer: Buffer,
  expectedMedia: Map<string, number>,
  onProgress?: SaveProgressCallback
): Promise<void> {
  const fh = await open(archivePath, 'r+')
  try {
    const { size: fileSize } = await fh.stat()
    if (fileSize > ZIP64_MARK) throw new Error('archive too large for incremental update')

    const tailLen = Math.min(fileSize, 66_000)
    const tail = Buffer.alloc(tailLen)
    await fh.read(tail, 0, tailLen, fileSize - tailLen)
    const eocd = findEocd(tail)

    const cd = Buffer.alloc(eocd.cdSize)
    await fh.read(cd, 0, eocd.cdSize, eocd.cdOffset)
    const records = parseCentralDirectory(cd, eocd.count)

    // The media set must match exactly (names + sizes) for in-place reuse.
    const media = records.filter((r) => r.name !== jsonName)
    if (media.length !== expectedMedia.size) throw new Error('media set changed')
    if (!records.some((r) => r.name === jsonName)) throw new Error('archive missing quiz.json')
    let mediaPayload = 0
    for (const m of media) {
      if (expectedMedia.get(m.name) !== m.uncompressedSize) throw new Error('media set changed')
      mediaPayload += 30 + Buffer.byteLength(m.name, 'utf-8') + m.compressedSize
    }

    // Compaction guard: once dead bytes dominate, a full rewrite is cheaper long-term.
    if (fileSize > mediaPayload * 1.5 + 65_536) throw new Error('archive bloated — compact via full rewrite')

    const crc = crc32(jsonBuffer)
    const lfh = buildLocalHeader(jsonName, crc, jsonBuffer.length)
    const jsonOffset = fileSize
    const cdStart = jsonOffset + lfh.length + jsonBuffer.length
    if (cdStart > ZIP64_MARK) throw new Error('offset overflow — compact via full rewrite')

    const newCd = Buffer.concat([
      ...media.map((m) => m.raw),
      buildCentralRecord(jsonName, crc, jsonBuffer.length, jsonOffset)
    ])
    const eocdBuf = buildEocd(media.length + 1, newCd.length, cdStart)

    onProgress?.({
      phase: 'saving',
      files: 0,
      totalFiles: media.length + 1,
      bytes: 0,
      totalBytes: jsonBuffer.length
    })

    // Single append at EOF: quiz.json entry, fresh central directory, new EOCD.
    const payload = Buffer.concat([lfh, jsonBuffer, newCd, eocdBuf])
    await fh.write(payload, 0, payload.length, jsonOffset)
    await fh.sync()
  } finally {
    await fh.close()
  }
}
