import { useState, useEffect } from 'react'
import type { Project, Organization } from '../../types'
import { fetchOrganizations } from '../../lib/queries'

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
  const [client,  setClient]  = useState('')
  const [budget,  setBudget]  = useState('80')
  const [color,   setColor]   = useState(colorOptions[0])
  const [orgId,   setOrgId]   = useState('')
  const [orgs,    setOrgs]    = useState<Organization[]>([])

  useEffect(() => {
    fetchOrganizations().then(setOrgs).catch(() => {})
  }, [])

  function handleSubmit() {
    if (!name) return
    const newProject: Project = {
      id: Date.now().toString(),
      name, client: client || 'Internal',
      color,
      loggedHours: 0,
      budgetHours: parseInt(budget) || 80,
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
      <div style={{
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
            <input
              type="text"
              placeholder="e.g. Acme Corp (leave blank for Internal)"
              value={client}
              onChange={e => setClient(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Budget Hours</label>
            <input
              type="number"
              min="1"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              style={inputStyle}
            />
          </div>
          {orgs.length > 0 && (
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
        </div>

        {/* Preview bar */}
        <div style={{
          marginTop: '20px', height: '6px',
          borderRadius: '3px', background: color,
          transition: 'background 0.2s',
        }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button
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