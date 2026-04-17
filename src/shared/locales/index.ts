import en from './en.json'
import pl from './pl.json'

export const resources = {
  en: { translation: en },
  pl: { translation: pl }
} as const

/** Languages available in the picker. Add new languages here. */
export const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' }
] as const
