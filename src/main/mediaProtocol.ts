import { net, protocol } from 'electron'
import { join } from 'path'
import { getMediaDir } from '../data/quizFile'

export const MEDIA_PROTOCOL = 'triviacon-media'

export function registerMediaProtocol(): void {
  protocol.handle(MEDIA_PROTOCOL, (request) => {
    const mediaDir = getMediaDir()
    if (!mediaDir) {
      return new Response('No media directory loaded', { status: 404 })
    }

    const url = new URL(request.url)
    const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    const filePath = join(mediaDir, relativePath)

    // Prevent directory traversal
    if (!filePath.startsWith(mediaDir)) {
      return new Response('Forbidden', { status: 403 })
    }

    return net.fetch(`file://${filePath}`)
  })
}
