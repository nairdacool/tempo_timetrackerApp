import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            padding: '14px 18px',
            minWidth: '280px',
            maxWidth: '380px',
          },
          success: {
            duration: 3000,
            style: {
              background: 'var(--bg-card)',
              border: '1px solid var(--green)',
              borderLeft: '4px solid var(--green)',
            },
            iconTheme: { primary: 'var(--green)', secondary: 'white' },
          },
          error: {
            duration: 4000,
            style: {
              background: 'var(--bg-card)',
              border: '1px solid #c03030',
              borderLeft: '4px solid #c03030',
            },
            iconTheme: { primary: '#c03030', secondary: 'white' },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
)