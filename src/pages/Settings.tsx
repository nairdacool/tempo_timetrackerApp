import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { updateProfile, updatePassword } from '../lib/queries'

const PRESET_COLORS = [
  '#c8602a', '#2a7fc8', '#2ac87a', '#c82a5a',
  '#8a2ac8', '#c8a82a', '#2ac8c0', '#c85a2a',
  '#5a8a34', '#6a4ec8', '#c84e8a', '#4e8ac8',
]

function deriveInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px 28px',
      marginBottom: '20px',
    }}>
      <div style={{
        fontSize: '13px', fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.6px',
        marginBottom: '20px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px', fontWeight: 600,
        color: 'var(--text-muted)',
        marginBottom: '6px',
        textTransform: 'uppercase', letterSpacing: '0.4px',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--text)',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '9px 12px',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function Settings() {
  const { profile, refreshProfile } = useAuth()

  // --- Profile state ---
  const [fullName,   setFullName]   = useState(profile?.fullName   ?? '')
  const [initials,   setInitials]   = useState(profile?.initials   ?? '')
  const [color,      setColor]      = useState(profile?.color      ?? PRESET_COLORS[0])
  const [autoInitials, setAutoInitials] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg,    setProfileMsg]    = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // --- Password state ---
  const [newPassword,    setNewPassword]    = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [pwSaving,        setPwSaving]        = useState(false)
  const [pwMsg,           setPwMsg]           = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Sync if profile loads after mount
  useEffect(() => {
    if (!profile) return
    setFullName(profile.fullName)
    setInitials(profile.initials)
    setColor(profile.color)
  }, [profile?.id])

  function handleNameChange(val: string) {
    setFullName(val)
    if (autoInitials) setInitials(deriveInitials(val))
  }

  function handleInitialsChange(val: string) {
    setInitials(val.toUpperCase().slice(0, 3))
    setAutoInitials(false)
  }

  async function handleProfileSave() {
    if (!fullName.trim()) { setProfileMsg({ type: 'error', text: 'Name is required.' }); return }
    if (!initials.trim()) { setProfileMsg({ type: 'error', text: 'Initials are required.' }); return }
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      await updateProfile({ fullName: fullName.trim(), initials: initials.trim(), color })
      await refreshProfile()
      setProfileMsg({ type: 'success', text: 'Profile updated.' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save.' })
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSave() {
    if (newPassword.length < 8) { setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return }
    if (newPassword !== confirmPassword) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return }
    setPwSaving(true)
    setPwMsg(null)
    try {
      await updatePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setPwMsg({ type: 'success', text: 'Password updated.' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password.' })
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div data-testid="settings-page" style={{ maxWidth: '560px', margin: '0 auto', padding: '8px 0 40px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--text)' }}>Settings</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Manage your profile and account security</div>
      </div>

      {/* Profile section */}
      <SectionCard title="Profile">
        {/* Avatar preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: 'white', flexShrink: 0,
            transition: 'background 0.2s',
          }}>
            {initials || '?'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            This is how you appear to others across the app.
          </div>
        </div>

        <Field label="Full name">
          <input
            data-testid="input-full-name"
            style={inputStyle}
            value={fullName}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Your full name"
          />
        </Field>

        <Field label="Initials">
          <input
            data-testid="input-initials"
            style={{ ...inputStyle, width: '80px' }}
            value={initials}
            maxLength={3}
            onChange={e => handleInitialsChange(e.target.value)}
            placeholder="AB"
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Auto-derived from name — edit to override
          </div>
        </Field>

        <Field label="Avatar color">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                data-testid={`color-btn-${c}`}
                onClick={() => setColor(c)}
                title={c}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: c, border: 'none', cursor: 'pointer', flexShrink: 0,
                  boxShadow: color === c ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${c}` : 'none',
                  transition: 'box-shadow 0.15s',
                }}
              />
            ))}
            {/* Custom color input */}
            <label
              data-testid="color-btn-custom"
              title="Custom color"
              style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: PRESET_COLORS.includes(color) ? 'var(--bg-subtle)' : color,
                border: '2px dashed var(--border)',
                cursor: 'pointer', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', flexShrink: 0,
                boxShadow: !PRESET_COLORS.includes(color) ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${color}` : 'none',
              }}
            >
              <input
                data-testid="input-color-custom"
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
              />
              {PRESET_COLORS.includes(color) && <span style={{ color: 'var(--text-muted)', lineHeight: 1 }}>+</span>}
            </label>
          </div>
        </Field>

        {profileMsg && (
          <div style={{
            marginTop: '4px', marginBottom: '12px',
            padding: '8px 12px', borderRadius: '8px',
            fontSize: '12px', fontWeight: 600,
            background: profileMsg.type === 'success' ? 'var(--green-light)' : '#fde8e8',
            color:      profileMsg.type === 'success' ? 'var(--green)'       : '#c03030',
          }}>
            {profileMsg.type === 'success' ? '✓ ' : '⚠ '}{profileMsg.text}
          </div>
        )}

        <button
          data-testid="btn-save-profile"
          onClick={handleProfileSave}
          disabled={profileSaving}
          style={{
            padding: '9px 24px', borderRadius: '8px',
            border: 'none', cursor: profileSaving ? 'default' : 'pointer',
            background: profileSaving ? 'var(--bg-subtle)' : 'var(--accent)',
            color: profileSaving ? 'var(--text-muted)' : 'white',
            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700,
            transition: 'all 0.15s',
          }}
        >
          {profileSaving ? 'Saving…' : 'Save profile'}
        </button>
      </SectionCard>

      {/* Password section */}
      <SectionCard title="Password">
        <Field label="New password">
          <div style={{ position: 'relative' }}>
            <input
              data-testid="input-new-password"
              type={showPw ? 'text' : 'password'}
              style={{ ...inputStyle, paddingRight: '40px' }}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
            <button
              data-testid="btn-toggle-password-visibility"
              onClick={() => setShowPw(v => !v)}
              style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent', border: 'none',
                cursor: 'pointer', color: 'var(--text-muted)',
                fontSize: '13px', padding: '2px',
              }}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>

        <Field label="Confirm password">
          <input
            data-testid="input-confirm-password"
            type={showPw ? 'text' : 'password'}
            style={inputStyle}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />
        </Field>

        {pwMsg && (
          <div style={{
            marginTop: '4px', marginBottom: '12px',
            padding: '8px 12px', borderRadius: '8px',
            fontSize: '12px', fontWeight: 600,
            background: pwMsg.type === 'success' ? 'var(--green-light)' : '#fde8e8',
            color:      pwMsg.type === 'success' ? 'var(--green)'       : '#c03030',
          }}>
            {pwMsg.type === 'success' ? '✓ ' : '⚠ '}{pwMsg.text}
          </div>
        )}

        <button
          data-testid="btn-update-password"
          onClick={handlePasswordSave}
          disabled={pwSaving}
          style={{
            padding: '9px 24px', borderRadius: '8px',
            border: 'none', cursor: pwSaving ? 'default' : 'pointer',
            background: pwSaving ? 'var(--bg-subtle)' : 'var(--accent)',
            color: pwSaving ? 'var(--text-muted)' : 'white',
            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700,
            transition: 'all 0.15s',
          }}
        >
          {pwSaving ? 'Updating…' : 'Update password'}
        </button>
      </SectionCard>
    </div>
  )
}
