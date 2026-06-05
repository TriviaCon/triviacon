import { convertFileSrc } from '@tauri-apps/api/core'

const MEDIA_PROTOCOL = 'triviacon-media'

/**
 * Absolute path to the currently-extracted media directory.
 * Set by the Tauri backend after a quiz is opened/created (and pushed to the
 * game screen via game state). When set, media resolves through the Tauri
 * asset protocol; when null (Electron build) we fall back to the custom
 * `triviacon-media://` streaming protocol.
 */
let mediaBaseDir: string | null = null

export function setMediaBaseDir(dir: string | null): void {
  mediaBaseDir = dir
}

/**
 * Whether media is currently served through the Tauri asset protocol.
 * Media elements routed through Web Audio (the visualizer) need
 * crossOrigin="anonymous" so the asset response isn't tainted.
 */
export function isAssetMedia(): boolean {
  return mediaBaseDir != null
}

/**
 * Convert a media path (stored in the quiz document) to a URL the renderer
 * can use.
 * - Data URIs and http(s) URLs are passed through unchanged.
 * - Otherwise: Tauri asset protocol (if a base dir is set), else the Electron
 *   custom protocol.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  if (mediaBaseDir) {
    const sep = mediaBaseDir.endsWith('/') || mediaBaseDir.endsWith('\\') ? '' : '/'
    return convertFileSrc(`${mediaBaseDir}${sep}${path}`)
  }
  return `${MEDIA_PROTOCOL}://media/${encodeURIComponent(path)}`
}
