import { useState, useEffect } from 'react'
import type { Project, Organization, Client } from '../../types'
import { fetchOrganizations, fetchClients, createClient } from '../../lib/queries'

const colorOptions = [
  '#c8602a', '#2a5fa8', '#2a7a4f',
  '#c87d2a', '#7a4fa8', '#2a8a8a',
]

interface NewProjectModalProps {
  onClose: () => void
  onAdd: (project: Project) => void
}

export default function NewProjectModal({ onClose, onAdd }: NewProjectModalProps) {
  const [name,    setName]    = useState('')
  const [budget,  setBudget]  = useState('80')
  const [color,   setColor]   = useState(colorOptions[0])
  const [billable, setBillable] = useState(true)
  const [orgId,   setOrgId]   = useState('')
  const [orgs,    setOrgs]    = useState<Organization[]>([])
  const [clients,           setClients]           = useState<Client[]>([])
  const [clientId,          setClientId]          = useState('')
  const [isCreatingClient,  setIsCreatingClient]  = useState(false)
  const [newClientName,     setNewClientName]     = useState('')

  useEffect(() => {
    fetchOrganizations().then(setOrgs).catch(() => {})
    fetchClients().then(setClients).catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!name) return
    let resolvedClientId   = clientId
    let resolvedClientName = clients.find(c => c.id === clientId)?.name ?? ''
    if (isCreatingClient && newClientName.trim()) {
      try {
        const created = await createClient(newClientName.trim())
        resolvedClientId   = created.id
        resolvedClientName = created.name
      } catch { /* proceed without client */ }
    }
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      client:   resolvedClientName || 'Internal',
      clientId: resolvedClientId   || undefined,
      color,
      loggedHours: 0,
      budgetHours: parseInt(budget) || 0,
      billable,
      status: 'active',
      team: [{ initials: 'JD', color: '#c8602a' }],
      organizationId: orgId || undefined,
    }
    onAdd(newProject)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div data-testid="modal-new-project" style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px',
        width: 'min(420px, calc(100vw - 32px))',
        maxHeight: '90vh',
        overflowY: 'auto',   
        zIndex: 201,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)' }}>
            New Project
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'none',
              border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '20px',
              lineHeight: 1, padding: '4px',
            }}
          >×</button>
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Project Color</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            {colorOptions.map(c => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%', background: c,
                  cursor: 'pointer',
                  border: color === c ? `3px solid var(--text)` : '3px solid transparent',
                  transition: 'border 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Project Name *</label>
            <input
              data-testid="input-project-name"
              autoFocus
              type="text"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Client</label>
            <select
              data-testid="select-client"
              value={isCreatingClient ? '__new__' : clientId}
              onChange={e => {
                if (e.target.value === '__new__') {
                  setIsCreatingClient(true)
                  setClientId('')
                } else {
                  setIsCreatingClient(false)
                  setClientId(e.target.value)
                }
              }}
              style={inputStyle}
            >
              <option value=''>— None (Internal) —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value='__new__'>＋ New Client…</option>
            </select>
            {isCreatingClient && (
              <input
                data-testid="input-new-client"
                type="text"
                placeholder="Client name"
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                style={{ ...inputStyle, marginTop: '8px' }}
                autoFocus
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>Budget Hours</label>
            <input
              data-testid="input-budget-hours"
              type="number"
              min="1"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              style={inputStyle}
            />
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
              data-testid="btn-toggle-billable"
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
          {orgs.length > 0 && (
            <div>
              <label style={labelStyle}>Organization</label>
              <select
                data-testid="select-organization"
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
        </div>

        {/* Preview bar */}
        <div style={{
          marginTop: '20px', height: '6px',
          borderRadius: '3px', background: color,
          transition: 'background 0.2s',
        }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button data-testid="btn-cancel" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button
            data-testid="btn-create-project"
            onClick={handleSubmit}
            disabled={!name}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              background: name ? 'var(--accent)' : 'var(--bg-subtle)',
              color: name ? 'white' : 'var(--text-muted)',
              border: 'none', fontFamily: 'var(--font-body)',
              fontSize: '13px', fontWeight: 600,
              cursor: name ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            Create Project
          </button>
        </div>
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
  borderRadius: '8px',
  padding: '9px 12px',
  outline: 'none',
  width: '100%',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '9px 20px', borderRadius: '8px',
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px', fontWeight: 600,
  cursor: 'pointer',
}