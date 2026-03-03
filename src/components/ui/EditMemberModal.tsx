import { useState } from 'react'
import type { Member } from '../../types'

interface EditMemberModalProps {
  member:   Member
  onSave:   (id: string, updates: { role?: string; is_active?: boolean }) => Promise<void>
  onClose:  () => void
}

const roleOptions = ['Admin', 'Developer', 'Designer', 'Other']
const predefinedRoles = new Set(roleOptions)

export default function EditMemberModal({ member, onSave, onClose }: EditMemberModalProps) {
  const isCustom = !predefinedRoles.has(member.role)
  const [role,       setRole]       = useState(isCustom ? 'Other' : member.role)
  const [customRole, setCustomRole] = useState(isCustom ? member.role : '')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const effectiveRole = role === 'Other' ? (customRole.trim() || 'Other') : role

  async function handleSave() {
    try {
      setSaving(true)
      await onSave(member.id, { role: effectiveRole })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  async function handleToggleActive() {
    try {
      setSaving(true)
      await onSave(member.id, { is_active: !member.isActive })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px', padding: '28px',
          width: '400px', maxWidth: '95vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: member.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {member.initials}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text)' }}>
              {member.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{member.email}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'transparent',
              border: 'none', color: 'var(--text-muted)',
              fontSize: '20px', cursor: 'pointer', padding: '4px 8px',
            }}
          >×</button>
        </div>

        {error && (
          <div style={{
            background: '#fde8e8', color: '#c03030',
            borderRadius: '8px', padding: '10px 14px',
            fontSize: '13px', marginBottom: '16px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Role selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Role</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {roleOptions.map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  padding: '7px 16px', borderRadius: '8px',
                  border: '1px solid',
                  borderColor: role === r ? 'var(--accent)' : 'var(--border)',
                  background: role === r ? 'var(--accent-light)' : 'transparent',
                  color: role === r ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {r}
              </button>
            ))}
          </div>
          {role === 'Other' && (
            <input
              type="text"
              placeholder="Enter custom role…"
              value={customRole}
              onChange={e => setCustomRole(e.target.value)}
              style={{
                marginTop: '10px',
                width: '100%', fontFamily: 'var(--font-body)',
                fontSize: '13.5px', color: 'var(--text)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px', padding: '9px 12px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        {/* Member status */}
        <div style={{
          background: 'var(--bg-subtle)', borderRadius: '10px',
          padding: '14px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Account Status
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {member.isActive ? 'Member has full access' : 'Member is deactivated'}
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: 600,
            color: member.isActive ? 'var(--green)' : 'var(--text-muted)',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: member.isActive ? 'var(--green)' : 'var(--border)',
            }} />
            {member.isActive ? 'Active' : 'Deactivated'}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {confirmDeactivate ? (
            <button
              onClick={handleToggleActive}
              disabled={saving}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                background: member.isActive ? '#c03030' : 'var(--green)',
                color: 'white', border: 'none',
                fontFamily: 'var(--font-body)', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              {member.isActive ? 'Confirm deactivate' : 'Confirm activate'}
            </button>
          ) : (
            <button
              onClick={() => setConfirmDeactivate(true)}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                background: 'transparent',
                color: member.isActive ? '#c03030' : 'var(--green)',
                border: `1px solid ${member.isActive ? '#f5c0c0' : 'var(--green-light)'}`,
                fontFamily: 'var(--font-body)', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              {member.isActive ? 'Deactivate' : 'Reactivate'}
            </button>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={onClose}
            style={{
              padding: '7px 16px', borderRadius: '8px',
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '7px 20px', borderRadius: '8px',
              background: !saving ? 'var(--accent)' : 'var(--bg-subtle)',
              color: !saving ? 'white' : 'var(--text-muted)',
              border: 'none', fontFamily: 'var(--font-body)',
              fontSize: '13px', fontWeight: 600,
              cursor: !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase',
  letterSpacing: '0.4px', marginBottom: '8px',
}