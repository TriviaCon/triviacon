export interface ThemeEntry {
  id: string
  labelKey: string
  isDark: boolean
}

export const THEMES: ThemeEntry[] = [
  { id: 'system',           labelKey: 'settings.themeSystem',          isDark: false },
  { id: 'default-light',    labelKey: 'settings.themeDefaultLight',    isDark: false },
  { id: 'default-dark',     labelKey: 'settings.themeDefaultDark',     isDark: true  },
  { id: 'solarized-light',  labelKey: 'settings.themeSolarizedLight',  isDark: false },
  { id: 'solarized-dark',   labelKey: 'settings.themeSolarizedDark',   isDark: true  },
  { id: 'catppuccin-latte', labelKey: 'settings.themeCatppuccinLatte', isDark: false },
  { id: 'catppuccin-mocha', labelKey: 'settings.themeCatppuccinMocha', isDark: true  },
  { id: 'dracula',          labelKey: 'settings.themeDracula',         isDark: true  },
  { id: 'alucard',          labelKey: 'settings.themeAlucard',         isDark: false },
  { id: 'borland',          labelKey: 'settings.themeBorland',         isDark: true  },
  { id: 'matrix',           labelKey: 'settings.themeMatrix',          isDark: true  },
]

export function resolveThemeId(themeId: string, isOsDark: boolean): string {
  if (themeId === 'system') return isOsDark ? 'default-dark' : 'default-light'
  return themeId
}

export function applyTheme(themeId: string): void {
  const isOsDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = resolveThemeId(themeId, isOsDark)
  document.documentElement.setAttribute('data-theme', resolved)
  const isDark = THEMES.find((t) => t.id === resolved)?.isDark ?? false
  document.documentElement.classList.toggle('dark', isDark)
}

let systemListener: (() => void) | null = null

export function startSystemThemeFollower(getThemeId: () => string): void {
  stopSystemThemeFollower()
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    if (getThemeId() === 'system') applyTheme('system')
  }
  mq.addEventListener('change', handler)
  systemListener = () => mq.removeEventListener('change', handler)
}

export function stopSystemThemeFollower(): void {
  systemListener?.()
  systemListener = null
}
