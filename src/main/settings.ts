import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'

export interface AppSettings {
  language: string
}

const DEFAULTS: AppSettings = {
  language: 'en'
}

const SETTINGS_FILENAME = 'triviacon-settings.json'

/** Try portable path (next to executable), fallback to userData. */
function resolveSettingsPath(): string {
  // Portable: next to the app executable
  const portablePath = join(dirname(app.getPath('exe')), SETTINGS_FILENAME)
  if (existsSync(portablePath)) return portablePath

  // Try writing to portable location
  try {
    writeFileSync(portablePath, JSON.stringify(DEFAULTS, null, 2))
    return portablePath
  } catch {
    // Not writable (e.g. system-installed) — fallback to userData
  }

  return join(app.getPath('userData'), SETTINGS_FILENAME)
}

let settingsPath: string | null = null
let cached: AppSettings | null = null

function getPath(): string {
  if (!settingsPath) settingsPath = resolveSettingsPath()
  return settingsPath
}

export function loadSettings(): AppSettings {
  if (cached) return cached

  const path = getPath()
  try {
    if (existsSync(path)) {
      const raw = readFileSync(path, 'utf-8')
      const merged: AppSettings = { ...DEFAULTS, ...JSON.parse(raw) }
      cached = merged
      return merged
    }
  } catch {
    // Corrupt file — use defaults
  }

  cached = { ...DEFAULTS }
  saveSettings(cached)
  return cached
}

export function saveSettings(settings: AppSettings): void {
  cached = settings
  const path = getPath()
  try {
    writeFileSync(path, JSON.stringify(settings, null, 2))
  } catch (err) {
    console.error('Failed to save settings:', err)
  }
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return loadSettings()[key]
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  const settings = loadSettings()
  settings[key] = value
  saveSettings(settings)
}
