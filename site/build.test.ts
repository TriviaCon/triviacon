import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BASE_URL,
  DOCS_DIR,
  LOCALES,
  RUNTIME_KEYS,
  loadStrings,
  loadTemplate,
  renderPage,
  renderSite,
  templateKeys
} from './build'

const template = loadTemplate()
const [defaultLocale] = LOCALES

describe('site locales', () => {
  const keySets = LOCALES.map((l) => ({
    code: l.code,
    keys: Object.keys(loadStrings(l.code)).sort()
  }))

  it.each(keySets.slice(1))('$code has exactly the keys of the default locale', ({ keys }) => {
    expect(keys).toEqual(keySets[0].keys)
  })

  it('has no keys the template and page script never use', () => {
    const used = new Set([...templateKeys(template), ...RUNTIME_KEYS])
    expect(keySets[0].keys.filter((k) => !used.has(k))).toEqual([])
  })

  it.each(LOCALES)('$code strings contain no ASCII double quotes (they break attributes)', (l) => {
    const offenders = Object.entries(loadStrings(l.code)).filter(([, v]) => v.includes('"'))
    expect(offenders).toEqual([])
  })
})

describe('renderPage', () => {
  it('throws when a locale is missing a key the template uses', () => {
    const strings = loadStrings(defaultLocale.code)
    delete strings.heroLede
    expect(() => renderPage(template, strings, defaultLocale)).toThrow('{{heroLede}}')
  })

  it.each(LOCALES)('renders $code with no placeholders left', (l) => {
    expect(renderPage(template, loadStrings(l.code), l)).not.toMatch(/\{\{@?\w+\}\}/)
  })

  it('points assets at the site root from a nested locale', () => {
    const pl = LOCALES.find((l) => l.code === 'pl')!
    const html = renderPage(template, loadStrings('pl'), pl)
    expect(html).toContain('href="../style.css"')
    expect(html).toContain('<html lang="pl">')
    expect(html).toContain(`<link rel="canonical" href="${BASE_URL}pl/" />`)
    expect(html).toContain('<a href="../" hreflang="en"')
    expect(html).toContain(
      'href="./" hreflang="pl" lang="pl" data-lang-set="pl" aria-current="page"'
    )
  })

  it('only the default page carries the language redirect', () => {
    const pages = renderSite()
    expect(pages.get('index.html')).toContain('location.replace')
    expect(pages.get('pl/index.html')).not.toContain('location.replace')
  })

  it('lists every locale plus x-default as alternates', () => {
    const html = renderSite().get('index.html')!
    for (const l of LOCALES)
      expect(html).toContain(`hreflang="${l.code}" href="${BASE_URL}${l.path}"`)
    expect(html).toContain(`hreflang="x-default" href="${BASE_URL}"`)
  })
})

describe('committed site', () => {
  it.each([...renderSite()])('docs/%s is up to date — run `pnpm site:build`', (file, html) => {
    expect(readFileSync(join(DOCS_DIR, file), 'utf8')).toBe(html)
  })
})
