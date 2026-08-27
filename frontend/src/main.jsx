import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ─── Keep-Alive Ping ──────────────────────────────────────────────────────────
// Render free tier sleeps after 15 min of inactivity.
// This silently pings the backend /health every 14 min to keep it awake.
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const keepAlive = () => {
  fetch(`${BACKEND_URL}/health`)
    .then(() => console.log('[keep-alive] Backend pinged ✅'))
    .catch(() => console.warn('[keep-alive] Backend ping failed ⚠️'))
}
keepAlive() // ping immediately on load
setInterval(keepAlive, 14 * 60 * 1000) // then every 14 minutes
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
