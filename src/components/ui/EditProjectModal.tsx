import { useState, useEffect, useContext } from 'react'
import type { Project, Organization } from '../../types'
import { fetchProjectMembers, addProjectMember, removeProjectMember, fetchOrganizations, addProjectToOrg, removeProjectFromOrg } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import { AuthContext } from '../../context/AuthContextInstance'

interface EditProjectModalProps {
  project:  Project
  onSave:   (updates: { name: string; color: string; budgetHours: number; billable: boolean; status: string }) => Promise<void>
  onDelete: () => Promise<void>
  onClose:  () => void
}

const colorOptions = [
  '#c8602a', '#2a5fa8', '#2a7a4f', '#c87d2a',
  '#7a2a8f', '#c02a4a', '#2a8fa8', '#5a7a2a',
  '#8f6a2a', '#2a4ac8',
]

const statusOptions = [
  { value: 'active',    label: 'Active'    },
  { value: 'on-hold',   label: 'On Hold'   },
  { value: 'completed', label: 'Completed' },
  { value: 'archived',  label: 'Archived'  },
]

export default function EditProjectModal({ project, onSave, onDelete, onClose }: EditProjectModalProps) {
  const { isAdmin } = useContext(AuthContext)

  const [name,          setName]          = useState(project.name)
  const [color,         setColor]         = useState(project.color)
  const [budgetHours,   setBudgetHours]   = useState(project.budgetHours)
  const [billable,      setBillable]      = useState(project.billable ?? true)
  const [status,        setStatus]        = useState<string>(project.status)
  const [saving,        setSaving]        = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // Member assignment state
  const [members,      setMembers]      = useState<any[]>([])
  const [allProfiles,  setAllProfiles]  = useState<any[]>([])
  const [memberLoading, setMemberLoading] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  // Organization state
  const [orgs,  setOrgs]  = useState<Organization[]>([])
  const [orgId, setOrgId] = useState<string>(project.organizationId ?? '')

  const isValid = name.trim().length > 0 && budgetHours > 0

  // Load current members + all profiles + organizations (admin only)
  useEffect(() => {
    if (!isAdmin) return
    async function loadData() {
      setMemberLoading(true)
      try {
        const [currentMembers, profilesRes, orgList] = await Promise.all([
          fetchProjectMembers(project.id),
          supabase.from('profiles').select('id, full_name, initials, color, role').eq('is_active', true).order('full_name'),
          fetchOrganizations(),
        ])
        setMembers(currentMembers)
        setAllProfiles(profilesRes.data ?? [])
        setOrgs(orgList)
      } catch (e) {
        console.error(e)
      } finally {
        setMemberLoading(false)
      }
    }
    loadData()
  }, [project.id, isAdmin])

  async function handleToggleMember(profileId: string) {
    const isMember = members.some(m => m.id === profileId)
    try {
      if (isMember) {
        await removeProjectMember(project.id, profileId)
        setMembers(prev => prev.filter(m => m.id !== profileId))
      } else {
        await addProjectMember(project.id, profileId)
        const profile = allProfiles.find(p => p.id === profileId)
        if (profile) setMembers(prev => [...prev, profile])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update member')
    }
  }

  async function handleSave() {
    if (!isValid) return
    try {
      setSaving(true)
      setError(null)
      await onSave({ name: name.trim(), color, budgetHours, billable, status })
      // Update organization assignment
      if (orgId) {
        await addProjectToOrg(orgId, project.id)
      } else {
        await removeProjectFromOrg(project.id)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      setSaving(true)
      await onDelete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
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
        data-testid="modal-edit-project"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px', padding: '28px',
          width: '480px', maxWidth: '95vw',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: color, marginRight: '12px', flexShrink: 0,
            transition: 'background 0.2s',
          }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text)' }}>
              Edit Project
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {project.client}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'transparent',
              border: 'none', color: 'var(--text-muted)',
              fontSize: '20px', cursor: 'pointer', padding: '4px 8px',
              borderRadius: '6px',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Project Name</label>
            <input
              data-testid="input-project-name"
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              autoFocus style={inputStyle}
            />
          </div>

          {/* Color */}
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {colorOptions.map(c => (
                <button
                  key={c} onClick={() => setColor(c)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid white' : '2px solid transparent',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Budget hours + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Budget Hours</label>
              <input
                type="number" min={1} value={budgetHours}
                onChange={e => setBudgetHours(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Billable toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={labelStyle}>Billable</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                {billable ? 'Hours count toward billable totals' : 'Internal / non-billable project'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBillable(b => !b)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                border: 'none', cursor: 'pointer', position: 'relative',
                background: billable ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: billable ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Organization — admin only */}
          {isAdmin && orgs.length > 0 && (
            <div>
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

          {/* Progress preview */}
          <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Budget preview</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {project.loggedHours}h logged / {budgetHours}h budget
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '3px', background: color,
                width: `${Math.min(100, Math.round((project.loggedHours / budgetHours) * 100))}%`,
                transition: 'width 0.3s, background 0.2s',
              }} />
            </div>
          </div>

          {/* Team Members — admin only */}
          {isAdmin && (
            <div>
              <label style={labelStyle}>Team Members</label>
              {memberLoading ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>Loading…</div>
              ) : (
                <>
                  {/* Search input */}
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                      <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search members…"
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '7px 10px 7px 30px',
                        fontFamily: 'var(--font-body)', fontSize: '13px',
                        color: 'var(--text)', background: 'var(--bg-card)',
                        border: '1px solid var(--border)', borderRadius: '8px', outline: 'none',
                      }}
                    />
                  </div>

                  {/* Member list */}
                  <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: '10px', overflow: 'hidden',
                    maxHeight: '260px', overflowY: 'auto',
                  }}>
                    {allProfiles.filter(p =>
                      p.full_name.toLowerCase().includes(memberSearch.toLowerCase())
                    ).length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                        No members match
                      </div>
                    ) : allProfiles.filter(p =>
                        p.full_name.toLowerCase().includes(memberSearch.toLowerCase())
                      ).map((profile, i, arr) => {
                        const isMember = members.some(m => m.id === profile.id)
                        return (
                          <div
                            key={profile.id}
                            onClick={() => handleToggleMember(profile.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 14px',
                              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                              cursor: 'pointer',
                              background: isMember ? 'var(--accent-light)' : 'transparent',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => {
                              if (!isMember) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLDivElement).style.background = isMember ? 'var(--accent-light)' : 'transparent'
                            }}
                          >
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '50%',
                              background: profile.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0,
                            }}>
                              {profile.initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                                {profile.full_name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{profile.role}</div>
                            </div>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              border: isMember ? 'none' : '2px solid var(--border)',
                              background: isMember ? 'var(--accent)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, transition: 'all 0.15s',
                            }}>
                              {isMember && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </>
              )}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {members.length} member{members.length !== 1 ? 's' : ''} assigned
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          {confirmDelete ? (
            <button
              data-testid="btn-confirm-delete"
              onClick={handleDelete} disabled={saving}
              style={{
                padding: '10px 16px', borderRadius: '8px',
                background: '#c03030', color: 'white', border: 'none',
                fontFamily: 'var(--font-body)', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Confirm delete
            </button>
          ) : (
            <button
              data-testid="btn-delete"
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '10px 16px', borderRadius: '8px',
                background: 'transparent', color: '#c03030',
                border: '1px solid #f5c0c0',
                fontFamily: 'var(--font-body)', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Delete
            </button>
          )}

          <div style={{ flex: 1 }} />

          <button
            data-testid="btn-cancel"
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: '8px',
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
            disabled={!isValid || saving}
            style={{
              padding: '10px 24px', borderRadius: '8px',
              background: isValid && !saving ? 'var(--accent)' : 'var(--bg-subtle)',
              color: isValid && !saving ? 'white' : 'var(--text-muted)',
              border: 'none', fontFamily: 'var(--font-body)',
              fontSize: '13px', fontWeight: 600,
              cursor: isValid && !saving ? 'pointer' : 'not-allowed',
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
  letterSpacing: '0.4px', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-body)',
  fontSize: '13.5px', color: 'var(--text)',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: '8px', padding: '9px 12px',
  outline: 'none', boxSizing: 'border-box',
}