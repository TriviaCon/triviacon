import { describe, it, expect } from 'vitest'
import {
  sanitizeFilename,
  mediaDisplayName,
  detectMediaType,
  activeQuestionMedia,
  ALLOWED_MEDIA_EXTENSIONS,
  type MediaType
} from '@shared/media'

describe('sanitizeFilename', () => {
  it('preserves normal ASCII filenames', () => {
    expect(sanitizeFilename('funky-town')).toBe('funky-town')
  })

  it('preserves Unicode letters', () => {
    expect(sanitizeFilename('Włochy — Runda 3')).toBe('Włochy — Runda 3')
    expect(sanitizeFilename('żółć')).toBe('żółć')
  })

  it('strips Windows-illegal characters', () => {
    expect(sanitizeFilename('file:name*with?bad<chars>')).toBe('filenamewithbadchars')
  })

  it('strips path separators', () => {
    expect(sanitizeFilename('path/to\\file')).toBe('pathtofile')
  })

  it('strips double quotes and pipes', () => {
    expect(sanitizeFilename('"quoted"|piped')).toBe('quotedpiped')
  })

  it('trims leading and trailing dots', () => {
    expect(sanitizeFilename('...hidden')).toBe('hidden')
    expect(sanitizeFilename('file...')).toBe('file')
  })

  it('trims leading and trailing spaces', () => {
    expect(sanitizeFilename('  spaced  ')).toBe('spaced')
  })

  it('collapses multiple dashes', () => {
    expect(sanitizeFilename('a---b----c')).toBe('a-b-c')
  })

  it('handles a fully illegal filename gracefully', () => {
    expect(sanitizeFilename('*:?"<>|')).toBe('')
  })

  it('handles empty string', () => {
    expect(sanitizeFilename('')).toBe('')
  })
})

describe('mediaDisplayName', () => {
  it('extracts original name from new format', () => {
    expect(mediaDisplayName('funky-town-a3f2b1c4-5678-9abc-def0-1234567890ab.mp3'))
      .toBe('funky-town.mp3')
  })

  it('handles Unicode original names', () => {
    expect(mediaDisplayName('Włochy — Runda 3-a3f2b1c4-5678-9abc-def0-1234567890ab.mp4'))
      .toBe('Włochy — Runda 3.mp4')
  })

  it('returns legacy UUID-only filenames as-is', () => {
    expect(mediaDisplayName('a3f2b1c4-5678-9abc-def0-1234567890ab.mp3'))
      .toBe('a3f2b1c4-5678-9abc-def0-1234567890ab.mp3')
  })

  it('returns filenames without UUID as-is', () => {
    expect(mediaDisplayName('some-file.png')).toBe('some-file.png')
  })

  it('handles null and undefined', () => {
    expect(mediaDisplayName(null)).toBeNull()
    expect(mediaDisplayName(undefined)).toBeNull()
  })

  it('handles files without extension', () => {
    expect(mediaDisplayName('myfile-a3f2b1c4-5678-9abc-def0-1234567890ab'))
      .toBe('myfile')
  })
})

describe('detectMediaType', () => {
  // Pins the classification of every advertised extension. This table and
  // ALLOWED_MEDIA_EXTENSIONS share one source of truth (MEDIA_TYPE_BY_EXT), so
  // this guards against the kind of two-lists drift that made webm classify as
  // audio (see #76).
  const expected: Record<string, Exclude<MediaType, null>> = {
    mp3: 'audio', wav: 'audio', ogg: 'audio', aac: 'audio', m4a: 'audio',
    mp4: 'video', webm: 'video', mov: 'video',
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image'
  }

  it('classifies every allowed extension as its documented type', () => {
    for (const ext of ALLOWED_MEDIA_EXTENSIONS) {
      expect(detectMediaType(`clip.${ext}`), ext).toBe(expected[ext])
    }
  })

  it('covers exactly the allowed set — no untested extension, no phantom', () => {
    expect([...ALLOWED_MEDIA_EXTENSIONS].sort()).toEqual(Object.keys(expected).sort())
  })

  it('classifies webm as video, not audio', () => {
    // Regression pin for #76: webm is the one ambiguous container, and it must
    // resolve to video so its picture is shown and the audioOnly toggle appears.
    expect(detectMediaType('intro.webm')).toBe('video')
    expect(detectMediaType('clip-a3f2b1c4-5678-9abc-def0-1234567890ab.webm')).toBe('video')
  })

  it('is case-insensitive on the extension', () => {
    expect(detectMediaType('PHOTO.PNG')).toBe('image')
    expect(detectMediaType('Clip.WebM')).toBe('video')
  })

  it('strips query strings and fragments before classifying', () => {
    expect(detectMediaType('song.mp3?v=2')).toBe('audio')
    expect(detectMediaType('pic.jpg#anchor')).toBe('image')
  })

  it('reads the type from data URIs', () => {
    expect(detectMediaType('data:image/png;base64,AAAA')).toBe('image')
    expect(detectMediaType('data:audio/mp3;base64,AAAA')).toBe('audio')
    expect(detectMediaType('data:video/mp4;base64,AAAA')).toBe('video')
  })

  it('returns null for empty, missing, or extensionless input', () => {
    expect(detectMediaType(null)).toBeNull()
    expect(detectMediaType(undefined)).toBeNull()
    expect(detectMediaType('')).toBeNull()
    expect(detectMediaType('noextension')).toBeNull()
  })

  it('returns null for unrecognised extensions instead of guessing image', () => {
    // Containers the app does not accept must not be silently rendered — and
    // must not be misclassified as audio/video as they once were.
    for (const ext of ['flac', 'ogv', 'avi', 'mkv', 'txt', 'exe']) {
      expect(detectMediaType(`file.${ext}`), ext).toBeNull()
      expect(ALLOWED_MEDIA_EXTENSIONS, ext).not.toContain(ext)
    }
  })
})

describe('activeQuestionMedia', () => {
  it('keeps the question media while the answer is hidden', () => {
    expect(activeQuestionMedia('q.mp3', 'a.mp3', false)).toEqual({ slot: 'question', file: 'q.mp3' })
  })

  it('hands the screen to the answer media once revealed', () => {
    expect(activeQuestionMedia('q.mp3', 'a.mp3', true)).toEqual({ slot: 'answer', file: 'a.mp3' })
  })

  it('keeps the question media when the answer has none', () => {
    expect(activeQuestionMedia('q.mp3', null, true)).toEqual({ slot: 'question', file: 'q.mp3' })
    expect(activeQuestionMedia('q.mp3', undefined, true)).toEqual({ slot: 'question', file: 'q.mp3' })
  })

  it('reports the answer media even when the question has none', () => {
    expect(activeQuestionMedia(null, 'a.mp3', true)).toEqual({ slot: 'answer', file: 'a.mp3' })
  })

  it('normalises a missing question media to null', () => {
    expect(activeQuestionMedia(undefined, null, false)).toEqual({ slot: 'question', file: null })
  })
})
