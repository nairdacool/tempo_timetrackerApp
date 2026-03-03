import { useState } from 'react'
import type { MemberRole } from '../../types'
import { supabase } from '../../lib/supabase'

const roles: MemberRole[] = ['Admin', 'Developer', 'Designer', 'Other']

const avatarColors = ['#c8602a', '#2a5fa8', '#2a7a4f', '#c87d2a', '#7a4fa8', '#2a8a8a']

interface InviteMemberModalProps {
  onClose:   () => void
  onSuccess: () => void
}

export default function InviteMemberModal({ onClose, onSuccess }: InviteMemberModalProps) {
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [role,       setRole]       = useState<MemberRole>('Developer')
  const [customRole, setCustomRole] = useState('')
  const [sending,    setSending]    = useState(false)
  const [sent,       setSent]       = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const effectiveRole = role === 'Other' ? (customRole.trim() || 'Other') : role

  function getInitials(fullName: string): string {
    return fullName.trim().split(' ')
      .map(w => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('')
  }

  async function handleInvite() {
    if (!name || !email) return
    setSending(true)
    setError(null)

    const color = avatarColors[Math.floor(Math.random() * avatarColors.length)]
    const initials = getInitials(name)

    const { data: fnData, error: fnError } = await supabase.functions.invoke('invite-member', {
      body: { email, fullName: name, role: effectiveRole, color, initials },
    })

    if (fnError || fnData?.error) {
      // fnError.context is the raw Response — read the JSON body for the real message
      let msg = fnData?.error ?? 'Failed to send invite'
      if (fnError) {
        try {
          const body = await (fnError as any).context?.json?.()
          msg = body?.error ?? fnError.message ?? msg
        } catch {
          msg = fnError.message ?? msg
        }
      }
      setError(msg)
      setSending(false)
      return
    }

    setSent(true)
    setTimeout(() => {
      onSuccess()
      onClose()
    }, 1800)
  }

  const isValid = name.trim().length > 0 && email.includes('@')

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px',
        width: '420px', zIndex: 201,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)' }}>
            Invite Team Member
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'none',
              border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1, padding: '4px',
            }}
          >×</button>
        </div>

        {sent ? (
          /* Success state */
          <div style={{
            textAlign: 'center', padding: '24px 0',
            color: 'var(--green)',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✓</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '6px' }}>
              Invite sent!
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {name} will receive a setup email at {email}
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                background: '#fde8e8', color: '#c03030',
                borderRadius: '8px', padding: '10px 14px',
                fontSize: '13px', marginBottom: '16px',
              }}>
                ⚠️ {error}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Work Email *</label>
                <input
                  type="email"
                  placeholder="e.g. sarah@acmecorp.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Role */}
              <div>
                <label style={labelStyle}>Role</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {roles.map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: '7px 0',
                        borderRadius: '8px', border: '1px solid',
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        borderColor: role === r ? 'var(--accent)' : 'var(--border)',
                        background:  role === r ? 'var(--accent-light)' : 'transparent',
                        color:       role === r ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {role === 'Other' && (
                  <input
                    autoFocus
                    type="text"
                    placeholder="Enter custom role…"
                    value={customRole}
                    onChange={e => setCustomRole(e.target.value)}
                    style={{ ...inputStyle, marginTop: '10px' }}
                  />
                )}
              </div>

              {/* Preview */}
              {name && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: 'white',
                  }}>
                    {getInitials(name) || '?'}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                    {name || '—'}
                  </div>
                  <div style={{
                    fontSize: '11px', color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    }}>
                    {effectiveRole} · {email || 'no email yet'}
                </div>
                </div>
                  <span style={{
                    marginLeft: 'auto', fontSize: '11px', fontWeight: 600,
                    padding: '2px 8px', borderRadius: '20px',
                    background: 'var(--amber-light)', color: 'var(--amber)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    Invite pending
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} disabled={sending} style={cancelBtnStyle}>Cancel</button>
              <button
                onClick={handleInvite}
                disabled={!isValid || sending}
                style={{
                  padding: '9px 20px', borderRadius: '8px',
                  background: isValid && !sending ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: isValid && !sending ? 'white' : 'var(--text-muted)',
                  border: 'none', fontFamily: 'var(--font-body)',
                  fontSize: '13px', fontWeight: 600,
                  cursor: isValid && !sending ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                {sending ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
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
  fontSize: '13.5px', color: 'var(--text)',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: '8px', padding: '9px 12px',
  outline: 'none', width: '100%',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '9px 20px', borderRadius: '8px',
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
}