import { describe, it, expect } from 'vitest'
import { sanitizeFilename, mediaDisplayName } from '@shared/media'

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
