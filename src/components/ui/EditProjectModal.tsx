import { useState } from 'react'
import type { Project } from '../../types'

interface EditProjectModalProps {
  project:  Project
  onSave:   (updates: { name: string; color: string; budgetHours: number; status: string }) => Promise<void>
  onDelete: () => Promise<void>
  onClose:  () => void
}

const colorOptions = [
  '#c8602a', '#2a5fa8', '#2a7a4f', '#c87d2a',
  '#7a2a8f', '#c02a4a', '#2a8fa8', '#5a7a2a',
  '#8f6a2a', '#2a4ac8',
]

const statusOptions = [
  { value: 'active',   label: 'Active'   },
  { value: 'on-hold',  label: 'On Hold'  },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export default function EditProjectModal({ project, onSave, onDelete, onClose }: EditProjectModalProps) {
  const [name,         setName]         = useState(project.name)
  const [color,        setColor]        = useState(project.color)
  const [budgetHours,  setBudgetHours]  = useState(project.budgetHours)
  const [status,       setStatus]       = useState<string>(project.status)
  const [saving,       setSaving]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const isValid = name.trim().length > 0 && budgetHours > 0

  async function handleSave() {
    if (!isValid) return
    try {
      setSaving(true)
      setError(null)
      await onSave({ name: name.trim(), color, budgetHours, status })
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
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px', padding: '28px',
          width: '460px', maxWidth: '95vw',
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
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              style={inputStyle}
            />
          </div>

          {/* Color */}
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {colorOptions.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px', height: '28px',
                    borderRadius: '50%', background: c,
                    border: color === c ? '3px solid white' : '2px solid transparent',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Budget hours + Status side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Budget Hours</label>
              <input
                type="number"
                min={1}
                value={budgetHours}
                onChange={e => setBudgetHours(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={inputStyle}
              >
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress preview */}
          <div style={{
            background: 'var(--bg-subtle)', borderRadius: '10px',
            padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Budget preview
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {project.loggedHours}h logged / {budgetHours}h budget
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '3px',
                background: color,
                width: `${Math.min(100, Math.round((project.loggedHours / budgetHours) * 100))}%`,
                transition: 'width 0.3s, background 0.2s',
              }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          {confirmDelete ? (
            <button
              onClick={handleDelete}
              disabled={saving}
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