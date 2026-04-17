import React from 'react'
import ReactDOM from 'react-dom/client'
import { initI18n } from '@shared/i18n'
import App from './App'

initI18n().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
