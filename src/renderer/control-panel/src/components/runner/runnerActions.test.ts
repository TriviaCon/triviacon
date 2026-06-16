import { describe, it, expect } from 'vitest'
import { canRevealQuestions, resolveQuestionClick } from './runnerActions'
import { GamePhase } from '@shared/types/state'

describe('resolveQuestionClick', () => {
  it('previews an unselected question on first click', () => {
    expect(resolveQuestionClick(5, null, GamePhase.Questions)).toEqual({ type: 'select', id: 5 })
  })

  it('reveals the already-selected question on the second click (list phase)', () => {
    expect(resolveQuestionClick(5, 5, GamePhase.Questions)).toEqual({ type: 'show', id: 5 })
  })

  it('switches the preview to a different question', () => {
    expect(resolveQuestionClick(7, 5, GamePhase.Questions)).toEqual({ type: 'select', id: 7 })
  })

  // Regression: revealing a question flips the phase to `Question` (singular). The host
  // must still be able to preview a sibling and reveal it — previously the reveal gate
  // failed here, so the second click deselected and the preview snapped back to the
  // on-screen question with nothing pushed to the game screen.
  it('reveals a selected sibling while another question is already on screen (Question phase)', () => {
    expect(resolveQuestionClick(7, 7, GamePhase.Question)).toEqual({ type: 'show', id: 7 })
  })

  it('switches the preview to a sibling while a question is on screen', () => {
    expect(resolveQuestionClick(8, 7, GamePhase.Question)).toEqual({ type: 'select', id: 8 })
  })

  it('toggles the selection off when re-clicking outside a reveal context', () => {
    expect(resolveQuestionClick(5, 5, GamePhase.Categories)).toEqual({ type: 'select', id: null })
  })
})

describe('canRevealQuestions', () => {
  it('is true for the question list and a shown question', () => {
    expect(canRevealQuestions(GamePhase.Questions)).toBe(true)
    expect(canRevealQuestions(GamePhase.Question)).toBe(true)
  })

  it('is false outside a question context', () => {
    expect(canRevealQuestions(GamePhase.Categories)).toBe(false)
    expect(canRevealQuestions(GamePhase.Splash)).toBe(false)
    expect(canRevealQuestions(GamePhase.Ranking)).toBe(false)
    expect(canRevealQuestions(GamePhase.Idle)).toBe(false)
  })
})
