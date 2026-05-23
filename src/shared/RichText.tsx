/**
 * Read-only renderer for rich-text question/answer content.
 *
 * Content is stored as a small subset of HTML (bold / italic / underline,
 * produced by the TipTap editor). It is sanitised on every render with a
 * hard tag allow-list and zero attributes, so a hand-edited or imported
 * .tcq can never smuggle in scripts or event handlers.
 *
 * Legacy quizzes stored plain strings. Strings with no HTML tags are
 * rendered as literal text (React escapes them), so e.g. "5 < 10" shows
 * correctly without any data migration.
 */
import type { JSX } from 'react'
import DOMPurify from 'dompurify'

/** Tags the editor can emit; everything else is stripped on render. */
const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u']

/** Matches a real opening/closing HTML tag (e.g. <u>, </strong>) — but not "5 < 10". */
const HTML_TAG_RE = /<\/?[a-z][^>]*>/i

export function looksLikeHtml(value: string): boolean {
  return HTML_TAG_RE.test(value)
}

/** Sanitise stored HTML down to the allowed B/I/U subset, no attributes. */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] })
}

type RichTextProps = {
  html: string | null | undefined
  className?: string
  /** Wrapping element. Defaults to a block div; use 'span' for inline contexts. */
  as?: 'div' | 'span'
}

export function RichText({ html, className, as = 'div' }: RichTextProps): JSX.Element | null {
  if (!html) return null

  // Legacy / plain-text content: render as text so React escapes it.
  if (!looksLikeHtml(html)) {
    return as === 'span' ? <span className={className}>{html}</span> : <div className={className}>{html}</div>
  }

  const clean = sanitizeRichText(html)
  return as === 'span' ? (
    <span className={className} dangerouslySetInnerHTML={{ __html: clean }} />
  ) : (
    <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
  )
}

/** Strip all tags to plain text — for compact contexts like the quiz tree button. */
export function richTextToPlain(html: string | null | undefined): string {
  if (!html) return ''
  if (!looksLikeHtml(html)) return html
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}
