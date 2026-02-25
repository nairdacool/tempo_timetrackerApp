import { useState } from 'react'
import type { Member, MemberRole } from '../../types'

const roles: MemberRole[] = ['Admin', 'Developer', 'Designer', 'Engineer']

const avatarColors = ['#c8602a', '#2a5fa8', '#2a7a4f', '#c87d2a', '#7a4fa8', '#2a8a8a']

interface InviteMemberModalProps {
  onClose: () => void
  onInvite: (member: Member) => void
}

export default function InviteMemberModal({ onClose, onInvite }: InviteMemberModalProps) {
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [role,  setRole]  = useState<MemberRole>('Developer')
  const [sent,  setSent]  = useState(false)

  function getInitials(fullName: string): string {
    return fullName.trim().split(' ')
      .map(w => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('')
  }

  function handleInvite() {
    if (!name || !email) return
    const newMember: Member = {
      id: Date.now(),
      name, email, role,
      initials: getInitials(name),
      color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      status: 'pending-invite',
      weekHours: 0,
      monthHours: 0,
      projectCount: 0,
    }
    onInvite(newMember)
    setSent(true)
    setTimeout(onClose, 1500)
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
              {name} will receive an email at {email}
            </div>
          </div>
        ) : (
          <>
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
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
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
                    {role} · {email || 'no email yet'}
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
              <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
              <button
                onClick={handleInvite}
                disabled={!isValid}
                style={{
                  padding: '9px 20px', borderRadius: '8px',
                  background: isValid ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: isValid ? 'white' : 'var(--text-muted)',
                  border: 'none', fontFamily: 'var(--font-body)',
                  fontSize: '13px', fontWeight: 600,
                  cursor: isValid ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                Send Invite
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