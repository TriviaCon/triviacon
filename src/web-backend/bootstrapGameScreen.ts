/**
 * Installs the game-screen window.api before anything else runs.
 * Imported first in the game-screen entry (main.tsx).
 */
import { api } from './gameScreenApi'

;(window as unknown as { api: typeof api }).api = api
