/**
 * Sanitise a filename so it's safe on every OS (Windows is the strictest).
 * Strips characters illegal on Windows, trims edge dots/spaces, and
 * collapses runs of dashes. Unicode letters are preserved.
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .replace(/-{2,}/g, '-')
}

// UUID v4 pattern: 8-4-4-4-12 hex digits
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/**
 * Extract a human-readable display name from a media filename.
 * New format: `originalname-<uuid>.ext` → `originalname.ext`
 * Legacy format: `<uuid>.ext` → `<uuid>.ext` (returned as-is)
 */
export function mediaDisplayName(filename: string | null | undefined): string | null {
  if (!filename) return null
  const dotIdx = filename.lastIndexOf('.')
  const base = dotIdx > 0 ? filename.slice(0, dotIdx) : filename
  const ext = dotIdx > 0 ? filename.slice(dotIdx) : ''
  const match = base.match(UUID_RE)
  if (!match) return filename
  const before = base.slice(0, match.index)
  // Legacy UUID-only filename — return as-is
  if (!before) return filename
  // Strip trailing dash left by `name-<uuid>` pattern
  const displayBase = before.replace(/-$/, '')
  return displayBase ? `${displayBase}${ext}` : filename
}

export type MediaType = 'image' | 'audio' | 'video' | null

/**
 * Canonical extension → media type map: the single source of truth for both
 * which files the app accepts (ALLOWED_MEDIA_EXTENSIONS) and how each one is
 * presented. Every accepted extension appears exactly once, so a file's
 * extension unambiguously selects the element it plays through — no extension is
 * classified two ways, and nothing outside this table can be attached.
 *
 * `webm` is the one accepted extension that can carry audio-only *or* audio+video
 * content, and it has no widely-emitted audio-only sibling (`.weba` exists on
 * paper but tools don't produce it). We map it to `video` — the superset, since a
 * <video> element also plays audio — and let the per-question `audioOnly` flag
 * present it as a visualiser when the picture would give the answer away. The
 * builder pre-sets that flag from the file's actual tracks at attach time; see
 * probeVideoTrack() in the control-panel lib.
 */
const MEDIA_TYPE_BY_EXT: Record<string, Exclude<MediaType, null>> = {
  mp3: 'audio', wav: 'audio', ogg: 'audio', aac: 'audio', m4a: 'audio',
  mp4: 'video', webm: 'video', mov: 'video',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image'
}

export const ALLOWED_MEDIA_EXTENSIONS = Object.keys(MEDIA_TYPE_BY_EXT)

/**
 * Detect media type from a data URI, URL, or file path. Returns `null` for an
 * empty src or an unrecognised extension — callers render nothing rather than a
 * broken element, so a hand-edited or legacy file with an unsupported extension
 * fails visibly-empty instead of silently misrendering.
 */
export function detectMediaType(src: string | null | undefined): MediaType {
  if (!src) return null

  // Data URIs: data:audio/mp3;base64,... or data:video/mp4;base64,...
  const dataMatch = src.match(/^data:(image|audio|video)\//)
  if (dataMatch) return dataMatch[1] as MediaType

  // URLs / file paths: classify by extension
  const ext = src.split(/[?#]/)[0].split('.').pop()?.toLowerCase()
  if (!ext) return null
  return MEDIA_TYPE_BY_EXT[ext] ?? null
}

export interface ActiveQuestionMedia {
  slot: 'question' | 'answer'
  file: string | null
}

/**
 * Which of a question's two media files the game screen is playing.
 *
 * The answer's media takes the screen once the answer is revealed; until then —
 * or when the answer has none — the question's own media holds it. The game
 * screen mounts a single element for whichever wins, so only one of the two can
 * be driven at any moment, and the runner shows transport controls for that one
 * alone. Both sides read this function so the rule can't drift between them.
 */
export function activeQuestionMedia(
  media: string | null | undefined,
  answerMedia: string | null | undefined,
  answerRevealed: boolean
): ActiveQuestionMedia {
  if (answerRevealed && answerMedia) return { slot: 'answer', file: answerMedia }
  return { slot: 'question', file: media ?? null }
}
