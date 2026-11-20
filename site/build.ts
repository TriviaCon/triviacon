// Renders the GitHub Pages site (served from /docs) into one static page per
// locale, so every language is real, indexable HTML rather than text swapped in
// by JavaScript. Run with `pnpm site:build`; the output is committed.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_DIR = dirname(fileURLToPath(import.meta.url))
export const DOCS_DIR = join(SITE_DIR, '..', 'docs')
export const BASE_URL = 'https://triviacon.github.io/triviacon/'

export type Strings = Record<string, string>

export interface Locale {
  code: string
  label: string
  // Output directory relative to /docs; '' is the site root.
  path: string
  ogLocale: string
}

// The first locale is the default: it lives at the root and is x-default.
export const LOCALES: Locale[] = [
  { code: 'en', label: 'EN', path: '', ogLocale: 'en_US' },
  { code: 'pl', label: 'PL', path: 'pl/', ogLocale: 'pl_PL' }
]

// Strings the page script needs after load (tour tabs, release line, OS button).
export const RUNTIME_KEYS = [
  'controlPanel',
  'gameScreen',
  'dlFor',
  'dlGeneric',
  'dlSubAll',
  'loading',
  'releaseLine',
  'releaseFail',
  'ph_board',
  'ph_question',
  'ph_ranking',
  'ph_builder',
  'note_board',
  'note_question',
  'note_ranking',
  'note_builder'
]

const PLACEHOLDER = /\{\{(@?\w+)\}\}/g

export function loadTemplate(): string {
  return readFileSync(join(SITE_DIR, 'template.html'), 'utf8')
}

export function loadStrings(code: string): Strings {
  return JSON.parse(readFileSync(join(SITE_DIR, 'locales', `${code}.json`), 'utf8'))
}

export function templateKeys(template: string): Set<string> {
  return new Set(
    [...template.matchAll(PLACEHOLDER)].map((m) => m[1]).filter((k) => !k.startsWith('@'))
  )
}

function relativeHref(from: Locale, to: Locale): string {
  if (from === to) return './'
  const up = from.path ? '../'.repeat(from.path.split('/').filter(Boolean).length) : ''
  return up + to.path || './'
}

function buildValues(locale: Locale, strings: Strings): Record<string, string> {
  const root = locale.path ? '../'.repeat(locale.path.split('/').filter(Boolean).length) : ''
  const [defaultLocale] = LOCALES
  const alternates = [
    ...LOCALES.map(
      (l) => `  <link rel="alternate" hreflang="${l.code}" href="${BASE_URL}${l.path}" />`
    ),
    `  <link rel="alternate" hreflang="x-default" href="${BASE_URL}${defaultLocale.path}" />`
  ].join('\n')
  const langLinks = LOCALES.map((l) => {
    const current = l.code === locale.code ? ' aria-current="page"' : ''
    return `        <a href="${relativeHref(locale, l)}" hreflang="${l.code}" lang="${l.code}" data-lang-set="${l.code}"${current}>${l.label}</a>`
  }).join('\n')
  // Only the default page redirects: a saved choice wins, otherwise a matching
  // browser language. Crawlers keep the default, and an explicit /pl/ link is
  // never bounced back.
  const others = LOCALES.filter((l) => l !== defaultLocale)
  const redirect =
    locale === defaultLocale
      ? [
          '  <script>',
          '    try {',
          "      const saved = localStorage.getItem('triviacon-lang')",
          `      const paths = ${JSON.stringify(Object.fromEntries(others.map((l) => [l.code, l.path])))}`,
          "      const pick = saved || (navigator.language || '').slice(0, 2).toLowerCase()",
          '      if (paths[pick]) location.replace(paths[pick] + location.hash)',
          '    } catch (_) {}',
          '  </script>'
        ].join('\n')
      : ''
  const data = JSON.stringify({
    lang: locale.code,
    root,
    t: Object.fromEntries(RUNTIME_KEYS.map((k) => [k, strings[k]]))
  }).replace(/</g, '\\u003c')
  return {
    lang: locale.code,
    root,
    base: BASE_URL,
    canonical: BASE_URL + locale.path,
    ogLocale: locale.ogLocale,
    alternates,
    langLinks,
    redirect,
    data
  }
}

export function renderPage(template: string, strings: Strings, locale: Locale): string {
  const values = buildValues(locale, strings)
  const lookup = (key: string) => {
    const value = key.startsWith('@') ? values[key.slice(1)] : strings[key]
    if (value === undefined)
      throw new Error(`site: no value for {{${key}}} in locale "${locale.code}"`)
    return value
  }
  return template
    .replace(/^[ \t]*\{\{(@?\w+)\}\}\n/gm, (line, key: string) => (lookup(key) === '' ? '' : line))
    .replace(PLACEHOLDER, (_, key: string) => lookup(key))
}

// Output path (relative to /docs) → HTML.
export function renderSite(): Map<string, string> {
  const template = loadTemplate()
  return new Map(
    LOCALES.map((l) => [`${l.path}index.html`, renderPage(template, loadStrings(l.code), l)])
  )
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const [file, html] of renderSite()) {
    const out = join(DOCS_DIR, file)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, html)
    console.log(`site: wrote docs/${file}`)
  }
}
