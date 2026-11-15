import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { applyTheme } from './ui/theme'
import './styles.css'

declare const __PWA__: boolean

applyTheme()
if (__PWA__) import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
