import { useState } from 'react'
import type { TimeEntry, EntryStatus } from '../../types'

const projects = [
  { name: 'Acme Website Redesign', color: '#c8602a' },
  { name: 'Backend API v2',        color: '#2a5fa8' },
  { name: 'Mobile App',            color: '#2a7a4f' },
  { name: 'Data Pipeline',         color: '#c87d2a' },
]

interface EntryFormProps {
  onAdd: (entry: TimeEntry) => void
}

// Helper: calculate duration string from two HH:MM strings
function calcDuration(start: string, end: string): string {
  if (!start || !end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const totalMins = (eh * 60 + em) - (sh * 60 + sm)
  if (totalMins <= 0) return ''
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export default function EntryForm({ onAdd }: EntryFormProps) {
  const [project,     setProject]     = useState(projects[0].name)
  const [description, setDescription] = useState('')
  const [date,        setDate]        = useState('2026-02-23')
  const [startTime,   setStartTime]   = useState('09:00')
  const [endTime,     setEndTime]     = useState('10:00')

  const duration = calcDuration(startTime, endTime)
  const projectColor = projects.find(p => p.name === project)?.color ?? '#c8602a'

  function handleAdd() {
    if (!description || !duration) return
    const newEntry: TimeEntry = {
      id: Date.now(),
      project,
      projectColor,
      description,
      date,
      startTime,
      endTime,
      duration,
      status: 'draft' as EntryStatus,
    }
    onAdd(newEntry)
    setDescription('')
    setStartTime('09:00')
    setEndTime('10:00')
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '2px dashed var(--border)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr auto',
      gap: '12px',
      alignItems: 'end',
    }}>
      {/* Project */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={labelStyle}>Project</label>
        <select value={project} onChange={e => setProject(e.target.value)} style={inputStyle}>
          {projects.map(p => <option key={p.name}>{p.name}</option>)}
        </select>
      </div>

      {/* Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={labelStyle}>Description</label>
        <input
          type="text"
          placeholder="What did you work on?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Date + Time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={labelStyle}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={labelStyle}>Start</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={labelStyle}>
            End {duration && <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>{duration}</span>}
          </label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={!description || !duration}
        style={{
          padding: '9px 20px',
          borderRadius: '8px',
          background: description && duration ? 'var(--accent)' : 'var(--bg-subtle)',
          color: description && duration ? 'white' : 'var(--text-muted)',
          border: 'none',
          fontFamily: 'var(--font-body)',
          fontSize: '13px', fontWeight: 600,
          cursor: description && duration ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        + Add Entry
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.4px',
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '13.5px', color: 'var(--text)',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '8px 12px',
  outline: 'none',
  width: '100%',
}