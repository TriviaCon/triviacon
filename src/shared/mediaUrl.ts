const MEDIA_PROTOCOL = 'triviacon-media'

/**
 * Convert a media path (stored in DB) to a URL the renderer can use.
 * - Data URIs and http(s) URLs are passed through unchanged.
 * - Relative paths are resolved via the triviacon-media:// protocol.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${MEDIA_PROTOCOL}://media/${encodeURIComponent(path)}`
}

/**
 * `crossOrigin` for a media element carrying a {@link mediaUrl} source.
 *
 * `triviacon-media://` is a different origin from the renderer, and since
 * Chromium 142 (Electron 39) `createMediaElementSource` on a cross-origin
 * element that wasn't fetched in CORS mode is silenced outright — no audio, and
 * an analyser that reads all zeros. Requesting CORS mode is what keeps the
 * audio visualiser fed and the sound audible.
 *
 * Returns undefined for `data:` and `http(s)` sources: those are passed through
 * from quiz content, we don't control their headers, and forcing CORS mode on
 * them would turn a working load into a hard media error.
 */
export function mediaCrossOrigin(src: string | null | undefined): 'anonymous' | undefined {
  return src?.startsWith(`${MEDIA_PROTOCOL}://`) ? 'anonymous' : undefined
}
