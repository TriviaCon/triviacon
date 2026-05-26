// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { sanitizeRichText, looksLikeHtml, richTextToPlain } from './RichText'

describe('sanitizeRichText', () => {
  it('keeps allowed B/I/U + paragraph/break tags', () => {
    expect(sanitizeRichText('<strong>a</strong>')).toBe('<strong>a</strong>')
    expect(sanitizeRichText('<em>a</em>')).toBe('<em>a</em>')
    expect(sanitizeRichText('<u>a</u>')).toBe('<u>a</u>')
    expect(sanitizeRichText('<p>a</p><p>b</p>')).toBe('<p>a</p><p>b</p>')
    expect(sanitizeRichText('a<br>b')).toContain('<br')
  })

  it('strips <script> and its content', () => {
    const out = sanitizeRichText('<strong>ok</strong><script>alert(1)</script>')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert(1)')
    expect(out).toContain('<strong>ok</strong>')
  })

  it('strips event-handler and other attributes', () => {
    const out = sanitizeRichText('<u onclick="evil()" style="color:red">x</u>')
    expect(out).toBe('<u>x</u>')
  })

  it('unwraps disallowed tags (links, headings) but keeps their text', () => {
    expect(sanitizeRichText('<a href="http://x">link</a>')).toBe('link')
    const heading = sanitizeRichText('<h1>Title</h1>')
    expect(heading).not.toContain('<h1')
    expect(heading).toContain('Title')
  })
})

describe('looksLikeHtml', () => {
  it('detects real tags', () => {
    expect(looksLikeHtml('<strong>x</strong>')).toBe(true)
    expect(looksLikeHtml('<br>')).toBe(true)
  })

  it('treats math/comparison text as plain (not HTML)', () => {
    expect(looksLikeHtml('5 < 10')).toBe(false)
    expect(looksLikeHtml('plain answer')).toBe(false)
  })
})

describe('richTextToPlain', () => {
  it('strips all formatting to text', () => {
    expect(richTextToPlain('<p><strong>Bold</strong> and <em>italic</em></p>')).toBe(
      'Bold and italic'
    )
  })
  it('passes plain/legacy text through unchanged', () => {
    expect(richTextToPlain('5 < 10')).toBe('5 < 10')
    expect(richTextToPlain('')).toBe('')
    expect(richTextToPlain(null)).toBe('')
  })
})
