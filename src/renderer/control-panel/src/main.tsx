import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { initI18n } from '@shared/i18n'
import { applyTheme, startSystemThemeFollower } from './lib/theme'
import App from './App'

// Apply persisted theme before first paint to avoid flash
const initialTheme = window.api.initialTheme ?? 'system'
applyTheme(initialTheme)

let currentTheme = initialTheme
startSystemThemeFollower(() => currentTheme)

// Expose a setter so SettingsView can update the follower's reference
export function setCurrentTheme(id: string): void {
  currentTheme = id
}

initI18n().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
