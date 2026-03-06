import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type AuthMode = 'login' | 'signup' | 'forgot'

export default function Login() {
  const [mode,         setMode]         = useState<AuthMode>('login')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [name,         setName]         = useState('')
  const [organization, setOrganization] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState<string | null>(null)

  // Check for deactivation error from AuthContext
  useEffect(() => {
    const authError = localStorage.getItem('auth_error')
    if (authError) {
      setError(authError)
      localStorage.removeItem('auth_error')
    }
  }, [])

  // Check for deactivation error after login attempts
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        const authError = localStorage.getItem('auth_error')
        if (authError && !error) {
          setError(authError)
          localStorage.removeItem('auth_error')
        }
      }, 100)
    }
  }, [loading, error])

  function getInitials(fullName: string): string {
    return fullName.trim().split(' ')
      .map(w => w[0]?.toUpperCase() ?? '')
      .slice(0, 2).join('')
  }

  async function handleForgotPassword() {
    if (!email.trim()) { setError('Enter your email address first.'); return }
    setLoading(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/settings`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSuccess('Password reset email sent! Check your inbox.')
  }

  async function handleSubmit() {
    if (mode === 'forgot') { await handleForgotPassword(); return }
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: {
            full_name:    name,
            initials:     getInitials(name),
            role:         'Admin',
            color:        '#c8602a',
            organization: organization.trim(),
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
    <div
      data-testid="login-page"
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
      <div
        data-testid="login-form"
        style={{
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
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {mode === 'login'
              ? 'Sign in to your Tempo workspace'
              : mode === 'signup'
              ? 'Start tracking your time today'
              : 'Enter your email and we\'ll send a reset link'}
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {mode === 'signup' && (
            <>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  data-testid="input-name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Organization Name</label>
                <input
                  data-testid="input-organization"
                  type="text"
                  placeholder="Acme Inc."
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              data-testid="input-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label style={labelStyle}>Password</label>
              <input
                data-testid="input-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={inputStyle}
              />
              {mode === 'login' && (
                <button
                  data-testid="btn-forgot-password"
                  type="button"
                  onClick={() => { setMode('forgot'); setError(null); setSuccess(null) }}
                  style={{
                    background: 'none', border: 'none', padding: '4px 0 0',
                    color: 'var(--text-muted)', fontSize: '12px',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}
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
          data-testid="btn-submit"
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
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        </button>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          {mode === 'forgot' ? 'Remember your password? ' : mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            data-testid="btn-toggle-mode"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null) }}
            style={{
              background: 'none', border: 'none',
              color: 'var(--accent)', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontSize: '13px',
            }}
          >
            {mode === 'forgot' ? 'Sign in' : mode === 'login' ? 'Sign up' : 'Sign in'}
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