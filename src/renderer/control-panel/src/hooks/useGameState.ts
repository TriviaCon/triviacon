import { useState, useEffect } from 'react'
import type { GameState } from '@shared/types/state'
import { INITIAL_GAME_STATE } from '@shared/types/state'

export function useGameState(): GameState {
  const [state, setState] = useState<GameState>(INITIAL_GAME_STATE)

  useEffect(() => {
    const cleanup = window.api.onStateUpdate((newState) => {
      setState(newState)
    })
    return cleanup
  }, [])

  return state
}
