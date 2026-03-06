import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface SetPasswordProps {
  onDone: () => void
}

export default function SetPassword({ onDone }: SetPasswordProps) {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSubmit() {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    onDone()
  }

  return (
    <div data-testid="set-password-page" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '40px',
        width: '380px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '28px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '16px', color: '#fff',
          }}>T</div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px', color: 'var(--text)',
          }}>Tempo</span>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px', color: 'var(--text)',
          marginBottom: '6px',
        }}>Set your password</h2>
        <p style={{
          fontSize: '14px', color: 'var(--text-muted)',
          marginBottom: '24px',
        }}>
          Welcome to Tempo! Choose a password to secure your account.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', padding: '10px 14px',
            color: '#ef4444', fontSize: '13px',
            marginBottom: '16px',
          }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 600,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: '6px',
          }}>
            NEW PASSWORD
          </label>
          <input
            data-testid="input-new-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg-input, var(--bg))',
              border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text)',
              fontSize: '14px', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 600,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: '6px',
          }}>
            CONFIRM PASSWORD
          </label>
          <input
            data-testid="input-confirm-password"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg-input, var(--bg))',
              border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text)',
              fontSize: '14px', boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          data-testid="btn-set-password"
          onClick={handleSubmit}
          disabled={loading || !password || !confirm}
          style={{
            width: '100%', padding: '12px',
            background: loading ? 'var(--text-muted)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Saving…' : 'Set Password & Continue'}
        </button>
      </div>
    </div>
  )
}
