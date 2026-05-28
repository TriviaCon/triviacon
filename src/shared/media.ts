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
