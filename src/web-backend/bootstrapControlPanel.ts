/**
 * Installs the control-panel window.api before anything else runs.
 * Imported first in the control-panel entry (main.tsx) so window.api exists
 * by the time i18n / React start calling it.
 */
import { api, initControlPanel } from './controlPanelApi'

;(window as unknown as { api: typeof api }).api = api
initControlPanel()
