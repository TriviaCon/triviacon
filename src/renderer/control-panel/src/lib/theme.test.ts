import { describe, it, expect } from 'vitest'
import { THEMES, resolveThemeId } from './theme'

describe('resolveThemeId', () => {
  it('resolves system to default-dark when OS is dark', () => {
    expect(resolveThemeId('system', true)).toBe('default-dark')
  })

  it('resolves system to default-light when OS is light', () => {
    expect(resolveThemeId('system', false)).toBe('default-light')
  })

  it('passes explicit theme ids through unchanged', () => {
    expect(resolveThemeId('dracula', true)).toBe('dracula')
    expect(resolveThemeId('solarized-light', false)).toBe('solarized-light')
    expect(resolveThemeId('catppuccin-mocha', false)).toBe('catppuccin-mocha')
  })
})

describe('THEMES registry', () => {
  it('contains system entry as first item', () => {
    expect(THEMES[0].id).toBe('system')
  })

  it('has unique ids', () => {
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all entries have a labelKey', () => {
    for (const entry of THEMES) {
      expect(entry.labelKey).toBeTruthy()
    }
  })
})
