import { GamePhase } from '@shared/types/state'

/**
 * Phases in which a previewed question can be revealed onto the game screen.
 * The question list (`Questions`) and a single shown question (`Question`) are both
 * valid reveal contexts — a host previewing a sibling while one question is already
 * on screen must still be able to reveal it.
 */
export function canRevealQuestions(phase: GamePhase): boolean {
  return phase === GamePhase.Questions || phase === GamePhase.Question
}

export type QuestionClickAction =
  | { type: 'show'; id: number }
  | { type: 'select'; id: number | null }

/**
 * Two-step reveal decision for a click on a question card:
 * - clicking the already-selected question reveals it on the game screen;
 * - clicking a different (or no-longer-selected) question switches/clears the preview.
 */
export function resolveQuestionClick(
  clickedId: number,
  selectedQuestionId: number | null,
  phase: GamePhase
): QuestionClickAction {
  if (selectedQuestionId === clickedId && canRevealQuestions(phase)) {
    return { type: 'show', id: clickedId }
  }
  return { type: 'select', id: selectedQuestionId === clickedId ? null : clickedId }
}
