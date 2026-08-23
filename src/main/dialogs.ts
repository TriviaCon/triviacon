/**
 * Native file dialogs with a remembered starting directory.
 *
 * Electron 43 made `defaultPath` default to the user's Downloads folder for
 * every dialog method, which also stops the OS from restoring the last-used
 * directory between invocations. For a portable app that runs off a stick with
 * the quiz sitting next to the executable, landing in Downloads every time is a
 * regression — so we track the directory ourselves and pass it back in.
 *
 * Quiz files and source media are tracked separately: hosts keep the two in
 * different places, and one shared memory would make every media pick fight
 * every quiz save.
 */

import { dialog, type BrowserWindow } from 'electron'
import { existsSync } from 'fs'
import { dirname } from 'path'
import { getSetting, setSetting } from './settings'

export type DialogScope = 'quiz' | 'media'

/**
 * The directory to reopen for `scope`, or `undefined` to let the OS decide.
 * A remembered directory that no longer exists (unplugged stick, deleted
 * folder) is discarded rather than passed on.
 */
function rememberedDir(scope: DialogScope): string | undefined {
  const dir = scope === 'quiz' ? getSetting('lastQuizDir') : getSetting('lastMediaDir')
  if (!dir || !existsSync(dir)) return undefined
  return dir
}

function remember(scope: DialogScope, filePath: string): void {
  const dir = dirname(filePath)
  if (scope === 'quiz') setSetting('lastQuizDir', dir)
  else setSetting('lastMediaDir', dir)
}

// Parent native dialogs to the control panel window. An unparented modal can
// hang the app on Linux, especially when the dialog is cancelled.
export async function showOpenDialog(
  parent: BrowserWindow | null,
  scope: DialogScope,
  options: Electron.OpenDialogOptions
): Promise<Electron.OpenDialogReturnValue> {
  const opts: Electron.OpenDialogOptions = { defaultPath: rememberedDir(scope), ...options }
  const result = parent
    ? await dialog.showOpenDialog(parent, opts)
    : await dialog.showOpenDialog(opts)
  if (!result.canceled && result.filePaths.length > 0) remember(scope, result.filePaths[0])
  return result
}

export async function showSaveDialog(
  parent: BrowserWindow | null,
  scope: DialogScope,
  options: Electron.SaveDialogOptions
): Promise<Electron.SaveDialogReturnValue> {
  const opts: Electron.SaveDialogOptions = { defaultPath: rememberedDir(scope), ...options }
  const result = parent
    ? await dialog.showSaveDialog(parent, opts)
    : await dialog.showSaveDialog(opts)
  if (!result.canceled && result.filePath) remember(scope, result.filePath)
  return result
}
