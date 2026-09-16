import { mediaCrossOrigin } from '@shared/mediaUrl'

/**
 * Probe whether a media file actually carries a video track by loading its
 * metadata into a detached <video> element and inspecting the decoded frame
 * size. A container the app classifies as video (webm, mp4, mov) may in fact
 * hold audio only — webm especially, since it shares one extension for both —
 * and such a file should be presented as an audio visualiser, not a black frame.
 *
 * Resolves:
 * - `true`  — the file has a video track (non-zero frame dimensions)
 * - `false` — metadata loaded but there is no video track (audio-only container)
 * - `null`  — the probe could not decide (load error or timeout); callers should
 *             leave the current presentation untouched rather than guess.
 */
export function probeVideoTrack(url: string, timeoutMs = 8000): Promise<boolean | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    const crossOrigin = mediaCrossOrigin(url)
    if (crossOrigin) video.crossOrigin = crossOrigin

    let settled = false
    const finish = (result: boolean | null): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      video.removeAttribute('src')
      video.load() // release the decoder / stop any buffering
      resolve(result)
    }

    const timer = setTimeout(() => finish(null), timeoutMs)
    video.addEventListener('loadedmetadata', () =>
      finish(video.videoWidth > 0 && video.videoHeight > 0)
    )
    video.addEventListener('error', () => finish(null))
    video.src = url
  })
}
