import { describe, it, expect } from 'vitest'
import { mediaUrl, mediaCrossOrigin } from './mediaUrl'

describe('mediaUrl', () => {
  it('routes archive-relative paths through the custom protocol', () => {
    expect(mediaUrl('cover.png')).toBe('triviacon-media://media/cover.png')
  })

  it('encodes names that would otherwise break the URL', () => {
    expect(mediaUrl('round 1 & 2.mp3')).toBe('triviacon-media://media/round%201%20%26%202.mp3')
  })

  it('passes data: and http(s) sources through untouched', () => {
    expect(mediaUrl('data:audio/mpeg;base64,AAAA')).toBe('data:audio/mpeg;base64,AAAA')
    expect(mediaUrl('https://example.test/a.mp3')).toBe('https://example.test/a.mp3')
    expect(mediaUrl('http://example.test/a.mp3')).toBe('http://example.test/a.mp3')
  })

  it('returns null for no media', () => {
    expect(mediaUrl(null)).toBeNull()
    expect(mediaUrl(undefined)).toBeNull()
    expect(mediaUrl('')).toBeNull()
  })
})

describe('mediaCrossOrigin', () => {
  // Chromium >=142 silences createMediaElementSource for a cross-origin element
  // that wasn't fetched in CORS mode, which kills both the audio and the
  // visualiser. Anything served over our own protocol must opt in.
  it('requests CORS mode for protocol-served media', () => {
    expect(mediaCrossOrigin(mediaUrl('theme.mp3'))).toBe('anonymous')
  })

  // We don't control the headers on quiz-supplied external sources, and forcing
  // CORS mode on one without them turns a working load into a hard media error.
  it('leaves data: and http(s) sources alone', () => {
    expect(mediaCrossOrigin('data:audio/mpeg;base64,AAAA')).toBeUndefined()
    expect(mediaCrossOrigin('https://example.test/a.mp3')).toBeUndefined()
    expect(mediaCrossOrigin('http://example.test/a.mp3')).toBeUndefined()
  })

  it('is safe for absent media', () => {
    expect(mediaCrossOrigin(null)).toBeUndefined()
    expect(mediaCrossOrigin(undefined)).toBeUndefined()
    expect(mediaCrossOrigin('')).toBeUndefined()
  })
})
