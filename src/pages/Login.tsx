import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type AuthMode = 'login' | 'signup'

export default function Login() {
  const [mode,     setMode]     = useState<AuthMode>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  // Check for deactivation error from AuthContext
  useEffect(() => {
    const authError = localStorage.getItem('auth_error')
    if (authError) {
      setError(authError)
      localStorage.removeItem('auth_error')
    }
  }, [])

  function getInitials(fullName: string): string {
    return fullName.trim().split(' ')
      .map(w => w[0]?.toUpperCase() ?? '')
      .slice(0, 2).join('')
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: {
            full_name: name,
            initials: getInitials(name),
            role: 'Developer',
            color: '#c8602a',
          }
        }
      })
      if (error) setError(error.message)
      else setSuccess('Account created! Check your email to confirm, then log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'var(--accent)', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>⏱</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px' }}>Tempo</span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--text)', marginBottom: '6px' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {mode === 'login'
              ? 'Sign in to your Tempo workspace'
              : 'Start tracking your time today'}
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {mode === 'signup' && (
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Error / Success messages */}
        {error && (
          <div style={{
            background: '#fde8e8', color: '#c03030',
            border: '1px solid #f5c0c0',
            borderRadius: '8px', padding: '10px 14px',
            fontSize: '13px', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: 'var(--green-light)', color: 'var(--green)',
            border: '1px solid var(--green)',
            borderRadius: '8px', padding: '10px 14px',
            fontSize: '13px', marginBottom: '16px',
          }}>
            {success}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            borderRadius: '10px', border: 'none',
            background: loading ? 'var(--bg-subtle)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : 'white',
            fontFamily: 'var(--font-body)',
            fontSize: '14px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            marginBottom: '16px',
          }}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null) }}
            style={{
              background: 'none', border: 'none',
              color: 'var(--accent)', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontSize: '13px',
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px', fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.4px',
  marginBottom: '5px',
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '14px', color: 'var(--text)',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: '8px', padding: '10px 14px',
  outline: 'none', width: '100%',
  transition: 'border-color 0.15s',
}