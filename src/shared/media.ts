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

export const ALLOWED_MEDIA_EXTENSIONS = [
  'mp3', 'wav', 'ogg', 'aac', 'm4a',
  'mp4', 'webm', 'mov',
  'png', 'jpg', 'jpeg', 'gif', 'webp'
]

/** Detect media type from a data URI, URL, or file path. */
export function detectMediaType(src: string | null | undefined): MediaType {
  if (!src) return null

  // Data URIs: data:audio/mp3;base64,... or data:video/mp4;base64,...
  const dataMatch = src.match(/^data:(image|audio|video)\//)
  if (dataMatch) return dataMatch[1] as MediaType

  // URLs / file paths: check extension
  const ext = src.split(/[?#]/)[0].split('.').pop()?.toLowerCase()
  if (!ext) return 'image' // fallback for unrecognized

  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'webm', 'm4a']
  const videoExts = ['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv']

  if (audioExts.includes(ext)) return 'audio'
  if (videoExts.includes(ext)) return 'video'
  return 'image'
}
