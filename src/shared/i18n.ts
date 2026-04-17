import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from '@shared/locales'

const DEFAULT_LANG = 'en'

/**
 * Initialise i18next for the current renderer window.
 *
 * 1. Bootstraps with the default language synchronously so the UI can render.
 * 2. Loads the persisted language preference from main-process settings.
 * 3. Subscribes to live language changes (triggered by the Settings panel or
 *    the other window) so both windows switch language simultaneously.
 */
export async function initI18n(): Promise<typeof i18n> {
  await i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANG,
    fallbackLng: DEFAULT_LANG,
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  })

  // Load persisted language preference
  try {
    const saved = await window.api.getLanguage()
    if (saved && saved !== DEFAULT_LANG) {
      await i18n.changeLanguage(saved)
    }
  } catch {
    // First run or no settings file — keep default
  }

  // Subscribe to live language changes from the other window / settings
  if (window.api.onLanguageChange) {
    window.api.onLanguageChange((lang: string) => {
      i18n.changeLanguage(lang)
    })
  }

  return i18n
}

export default i18n
