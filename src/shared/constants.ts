export const QUIZ_FILE_EXTENSION = '.tcq'
export const QUIZ_FILE_FILTER = { name: 'TriviaCON Quiz', extensions: ['tcq'] }

/**
 * GTK save dialogs on Linux don't auto-append the filter extension when the
 * typed filename has none (unlike Windows/macOS), so save handlers must do
 * it themselves.
 */
export function ensureQuizExtension(filePath: string): string {
  return filePath.toLowerCase().endsWith(QUIZ_FILE_EXTENSION) ? filePath : filePath + QUIZ_FILE_EXTENSION
}
