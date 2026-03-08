import { useState, useEffect } from 'react'
import type { Member, Organization } from '../../types'
import { fetchOrganizations, addMemberToOrg, removeMemberFromOrg } from '../../lib/queries'

interface EditMemberModalProps {
  member:   Member
  onSave:   (id: string, updates: { role?: string; is_active?: boolean; full_name?: string; initials?: string; color?: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose:  () => void
}

const roleOptions = ['Admin', 'Developer', 'Designer', 'Other']
const predefinedRoles = new Set(roleOptions)
const colorSwatches = ['#c8602a','#2a5fa8','#2a7a4f','#8b2ac8','#c8a12a','#c82a6b','#2ab5c8','#6b7280']

export default function EditMemberModal({ member, onSave, onDelete, onClose }: EditMemberModalProps) {
  const isCustom = !predefinedRoles.has(member.role)
  const [role,       setRole]       = useState(isCustom ? 'Other' : member.role)
  const [customRole, setCustomRole] = useState(isCustom ? member.role : '')
  const [fullName,   setFullName]   = useState(member.name)
  const [initials,   setInitials]   = useState(member.initials)
  const [color,      setColor]      = useState(member.color)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [confirmDelete,     setConfirmDelete]     = useState(false)
  const [orgs,  setOrgs]  = useState<Organization[]>([])
  const [orgId, setOrgId] = useState<string>(member.organizationId ?? '')

  useEffect(() => {
    fetchOrganizations().then(setOrgs).catch(() => {})
  }, [])

  const effectiveRole = role === 'Other' ? (customRole.trim() || 'Other') : role

  async function handleSave() {
    try {
      setSaving(true)
      await onSave(member.id, {
        role:      effectiveRole,
        full_name: fullName.trim() || member.name,
        initials:  initials.trim().slice(0, 2).toUpperCase() || member.initials,
        color,
      })
      // Update org assignment
      if (orgId) {
        await addMemberToOrg(orgId, member.id)
      } else {
        await removeMemberFromOrg(member.id)
      }
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

  async function handleDelete() {
    try {
      setSaving(true)
      await onDelete(member.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
      setSaving(false)
      setConfirmDelete(false)
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
        data-testid="modal-edit-member"
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
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {initials.slice(0,2).toUpperCase() || member.initials}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text)' }}>
              {fullName || member.name}
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

        {/* Name + Initials */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Full Name</label>
            <input
              data-testid="input-full-name"
              type="text"
              value={fullName}
              onChange={e => {
                setFullName(e.target.value)
                // auto-derive initials from first letters of each word
                const parts = e.target.value.trim().split(/\s+/)
                if (parts.length >= 2) setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase())
              }}
              style={inputStyle}
            />
          </div>
          <div style={{ width: '80px' }}>
            <label style={labelStyle}>Initials</label>
            <input
              data-testid="input-initials"
              type="text"
              maxLength={2}
              value={initials}
              onChange={e => setInitials(e.target.value.toUpperCase())}
              style={{ ...inputStyle, textAlign: 'center', textTransform: 'uppercase' }}
            />
          </div>
        </div>

        {/* Color */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Avatar Color</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {colorSwatches.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: c, border: 'none', cursor: 'pointer',
                  outline: color === c ? `3px solid var(--accent)` : '3px solid transparent',
                  outlineOffset: '2px', transition: 'outline 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Role</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {roleOptions.map(r => (
              <button
                key={r}
                data-testid={`role-btn-${r.toLowerCase()}`}
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
              data-testid="input-custom-role"
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

        {/* Organization — only render when orgs are available */}
        {orgs.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Organization</label>
            <select
              value={orgId}
              onChange={e => setOrgId(e.target.value)}
              style={inputStyle}
            >
              <option value=''>— None —</option>
              {orgs.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            {confirmDeactivate ? (
              <>
                <button
                  data-testid={member.isActive ? 'btn-confirm-deactivate' : 'btn-confirm-activate'}
                  onClick={handleToggleActive}
                  disabled={saving}
                  style={{
                    padding: '5px 10px', borderRadius: '6px',
                    background: member.isActive ? '#c03030' : 'var(--green)',
                    color: 'white', border: 'none',
                    fontFamily: 'var(--font-body)', fontSize: '11px',
                    fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {member.isActive ? 'Confirm' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDeactivate(false)}
                  style={{
                    padding: '5px 10px', borderRadius: '6px',
                    background: 'transparent', color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-body)', fontSize: '11px',
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                data-testid={member.isActive ? 'btn-deactivate' : 'btn-reactivate'}
                onClick={() => setConfirmDeactivate(true)}
                style={{
                  padding: '5px 10px', borderRadius: '6px',
                  background: 'transparent',
                  color: member.isActive ? 'var(--text-muted)' : 'var(--green)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-body)', fontSize: '11px',
                  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {member.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            )}
          </div>
        </div>

        {/* Footer — single row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Delete user — left side */}
          {confirmDelete ? (
            <>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Permanently delete?
              </span>
              <button
                data-testid="btn-confirm-delete"
                onClick={handleDelete}
                disabled={saving}
                style={{
                  padding: '6px 14px', borderRadius: '8px',
                  background: '#c03030', color: 'white',
                  border: 'none', fontFamily: 'var(--font-body)',
                  fontSize: '12px', fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '6px 12px', borderRadius: '8px',
                  background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-body)', fontSize: '12px',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              data-testid="btn-delete-user"
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '0', background: 'transparent', border: 'none',
                color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#c03030' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete user
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Primary actions — right side */}
          {!confirmDelete && (
            <>
              <button
                data-testid="btn-cancel"
                onClick={onClose}
                style={{
                  padding: '8px 18px', borderRadius: '8px',
                  background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-body)', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                data-testid="btn-save-changes"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 22px', borderRadius: '8px',
                  background: !saving ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: !saving ? 'white' : 'var(--text-muted)',
                  border: 'none', fontFamily: 'var(--font-body)',
                  fontSize: '13px', fontWeight: 600,
                  cursor: !saving ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          )}
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

const inputStyle: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-body)',
  fontSize: '13.5px', color: 'var(--text)',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: '8px', padding: '9px 12px',
  outline: 'none', boxSizing: 'border-box',
}