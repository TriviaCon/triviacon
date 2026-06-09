import { app } from 'electron'
import { dirname } from 'path'

/**
 * Resolve the portable root directory — the folder the user considers
 * "the app directory" where settings, runtime data, and Chromium userData
 * should live.
 *
 * - Linux AppImage: directory containing the .AppImage file
 *   (app.getPath('exe') points inside the read-only FUSE mount)
 * - macOS .app bundle: parent directory of the .app bundle
 *   (app.getPath('exe') points inside Contents/MacOS/)
 * - Windows / other: directory containing the executable
 */
export function getPortableRoot(): string {
  if (process.env.APPIMAGE) {
    return dirname(process.env.APPIMAGE)
  }

  if (process.platform === 'darwin') {
    const exe = app.getPath('exe')
    const match = exe.match(/^(.+)\/[^/]+\.app\/Contents\/MacOS\//)
    if (match) return match[1]
  }

  return dirname(app.getPath('exe'))
}
