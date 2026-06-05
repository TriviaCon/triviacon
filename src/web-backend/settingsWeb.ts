/**
 * App settings persisted as JSON in the Tauri app-config dir.
 * Web/webview port of src/main/settings.ts (async, plugin-fs backed).
 */
import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs'
import { appConfigDir, join } from '@tauri-apps/api/path'

export type VisualizerColorMode = 'heatmap' | 'rainbow' | 'gradient'

export interface AppSettings {
  language: string
  defaultVolume: number
  visualizerColorMode: VisualizerColorMode
  visualizerBarCount: number
}

const DEFAULTS: AppSettings = {
  language: 'en',
  defaultVolume: 0.1,
  visualizerColorMode: 'heatmap',
  visualizerBarCount: 48
}

const SETTINGS_FILENAME = 'triviacon-settings.json'

let cached: AppSettings | null = null
let settingsPath: string | null = null

async function getPath(): Promise<string> {
  if (settingsPath) return settingsPath
  const dir = await appConfigDir()
  if (!(await exists(dir))) await mkdir(dir, { recursive: true })
  settingsPath = await join(dir, SETTINGS_FILENAME)
  return settingsPath
}

export async function loadSettings(): Promise<AppSettings> {
  if (cached) return cached
  try {
    const path = await getPath()
    if (await exists(path)) {
      cached = { ...DEFAULTS, ...JSON.parse(await readTextFile(path)) }
      return cached
    }
  } catch {
    // Corrupt / unreadable — fall through to defaults
  }
  cached = { ...DEFAULTS }
  await saveSettings(cached)
  return cached
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  cached = settings
  try {
    await writeTextFile(await getPath(), JSON.stringify(settings, null, 2))
  } catch (err) {
    console.error('Failed to save settings:', err)
  }
}

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  return (await loadSettings())[key]
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const s = await loadSettings()
  s[key] = value
  await saveSettings(s)
}
