import { describe, it, expect } from 'vitest'
import { ensureQuizExtension } from '@shared/constants'

describe('ensureQuizExtension', () => {
  it('appends .tcq when missing', () => {
    expect(ensureQuizExtension('/home/user/My Quiz')).toBe('/home/user/My Quiz.tcq')
  })

  it('leaves an existing .tcq extension untouched', () => {
    expect(ensureQuizExtension('/home/user/My Quiz.tcq')).toBe('/home/user/My Quiz.tcq')
  })

  it('is case-insensitive when checking the existing extension', () => {
    expect(ensureQuizExtension('/home/user/My Quiz.TCQ')).toBe('/home/user/My Quiz.TCQ')
  })

  it('does not get confused by dots elsewhere in the path', () => {
    expect(ensureQuizExtension('/home/user.name/quiz.night/final')).toBe('/home/user.name/quiz.night/final.tcq')
  })
})
