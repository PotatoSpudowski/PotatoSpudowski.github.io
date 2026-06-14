import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import posthog from 'posthog-js'
import App from './App'
import './styles.css'

posthog.init('phc_vos7uxTUoxSbzjH6RBEt8x7aNibKub5jfNiLXsMeJR3c', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-05-30',
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
