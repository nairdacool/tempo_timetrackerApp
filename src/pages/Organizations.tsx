import { useState, useEffect, useCallback } from 'react'
import type { Organization } from '../types'
import {
  fetchOrganizations, createOrganization, renameOrganization, deleteOrganization,
  removeMemberFromOrg, removeProjectFromOrg,
} from '../lib/queries'

// ─── small reusable avatar ────────────────────────────────────────────────
function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700,
      color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

// ─── status pill ──────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    active:    ['#16a34a', 'rgba(22,163,74,0.12)'],
    'on-hold': ['#d97706', 'rgba(217,119,6,0.12)'],
    completed: ['#2563eb', 'rgba(37,99,235,0.12)'],
    archived:  ['#6b7280', 'rgba(107,114,128,0.12)'],
  }
  const [fg, bg] = colors[status] ?? colors.archived
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 20, color: fg, background: bg,
    }}>
      {status}
    </span>
  )
}

// ─── edit / delete organization modal ───────────────────────────────────
function OrgEditModal({
  org, onClose, onSave, onDelete,
}: {
  org:      Organization
  onClose:  () => void
  onSave:   (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [name,          setName]          = useState(org.name)
  const [saving,        setSaving]        = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave(org.id, name.trim())
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await onDelete(org.id)
      onClose()
    } catch (e) {
      setError((e as Error).message)
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
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, width: 420, maxWidth: '95vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--accent-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>🏢</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>
            Edit Organization
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'transparent',
              border: 'none', color: 'var(--text-muted)',
              fontSize: 20, cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
            }}
          >×</button>
        </div>

        {error && (
          <div style={{
            background: '#fde8e8', color: '#c03030',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, marginBottom: 16,
          }}>⚠️ {error}</div>
        )}

        {/* Name field */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.4px', marginBottom: 6,
          }}>Organization Name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
            style={{
              width: '100%', fontFamily: 'var(--font-body)',
              fontSize: '13.5px', color: 'var(--text)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 8, padding: '9px 12px',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {confirmDelete ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{
                padding: '10px 16px', borderRadius: 8,
                background: '#c03030', color: 'white', border: 'none',
                fontFamily: 'var(--font-body)', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Confirm delete
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '10px 16px', borderRadius: 8,
                background: 'transparent', color: '#c03030',
                border: '1px solid #f5c0c0',
                fontFamily: 'var(--font-body)', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Delete
            </button>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: 8,
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            style={{
              padding: '10px 24px', borderRadius: 8,
              background: name.trim() && !saving ? 'var(--accent)' : 'var(--bg-subtle)',
              color: name.trim() && !saving ? 'white' : 'var(--text-muted)',
              border: 'none', fontFamily: 'var(--font-body)',
              fontSize: 13, fontWeight: 600,
              cursor: name.trim() && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────
export default function Organizations() {
  const [orgs,        setOrgs]        = useState<Organization[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [selected,    setSelected]    = useState<Organization | null>(null)
  const [creating,    setCreating]    = useState(false)
  const [newOrgName,  setNewOrgName]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [orgModal,   setOrgModal]   = useState<Organization | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchOrganizations()
      setOrgs(data)
      // Keep selected in sync
      if (selected) setSelected(data.find(o => o.id === selected.id) ?? null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [selected])

  useEffect(() => { load() }, [])   // eslint-disable-line

  async function handleCreate() {
    if (!newOrgName.trim()) return
    setSaving(true)
    try {
      await createOrganization(newOrgName.trim())
      setNewOrgName('')
      setCreating(false)
      await load()
    } catch (e) { setError((e as Error).message) }
    setSaving(false)
  }

  async function handleModalSave(id: string, name: string) {
    await renameOrganization(id, name)
    await load()
  }

  async function handleModalDelete(id: string) {
    await deleteOrganization(id)
    if (selected?.id === id) setSelected(null)
    await load()
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--text)', margin: 0 }}>Organizations</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Manage your organizations and their members &amp; projects</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          + New Organization
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 20,
        }}>⚠ {error}</div>
      )}

      {/* Create inline form */}
      {creating && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--accent)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <input
            autoFocus
            placeholder="Organization name…"
            value={newOrgName}
            onChange={e => setNewOrgName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text)', fontSize: 14, outline: 'none',
            }}
          />
          <button onClick={handleCreate} disabled={saving || !newOrgName.trim()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Creating…' : 'Create'}
          </button>
          <button onClick={() => setCreating(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>Loading…</div>
      ) : orgs.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px dashed var(--border)',
          borderRadius: 12, padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>No organizations yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Create one to group your members and projects</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* Org list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orgs.map(org => {
              const isSelected = selected?.id === org.id
              return (
                <div
                  key={org.id}
                  onClick={() => setSelected(isSelected ? null : org)}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {(
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'var(--accent-light)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, flexShrink: 0,
                        }}>🏢</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {org.members.length} member{org.members.length !== 1 ? 's' : ''} · {org.projects.length} project{org.projects.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                          <button
                            title="Edit / Delete"
                            onClick={() => setOrgModal(org)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}
                          >✏</button>
                        </div>
                      </div>

                      {/* Member avatars preview */}
                      {org.members.length > 0 && (
                        <div style={{ display: 'flex', marginTop: 10, paddingLeft: 2 }}>
                          {org.members.slice(0, 6).map((m, i) => (
                            <div key={m.id} title={m.name} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 6 - i }}>
                              <Avatar initials={m.initials} color={m.color} size={24} />
                            </div>
                          ))}
                          {org.members.length > 6 && (
                            <div style={{ marginLeft: -8, width: 24, height: 24, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>
                              +{org.members.length - 6}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Members section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Members</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Assign via Edit Member modal</span>
                </div>
                {selected.members.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No members assigned. Edit a member to assign them here.</div>
                ) : (
                  <div>
                    {selected.members.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                        <Avatar initials={m.initials} color={m.color} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.role} · {m.email}</div>
                        </div>
                        <button
                          title="Remove from org"
                          onClick={async () => { await removeMemberFromOrg(m.id); await load() }}
                          style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 14, flexShrink: 0 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Projects section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Projects</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Assign via Edit Project modal</span>
                </div>
                {selected.projects.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No projects assigned. Edit a project to assign it here.</div>
                ) : (
                  <div>
                    {selected.projects.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                        <StatusPill status={p.status} />
                        <button
                          title="Remove from org"
                          onClick={async () => { await removeProjectFromOrg(p.id); await load() }}
                          style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 14, flexShrink: 0 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit / Delete Organization modal */}
      {orgModal && (
        <OrgEditModal
          org={orgModal}
          onClose={() => setOrgModal(null)}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
        />
      )}
    </div>
  )
}
