import type { TimeEntry } from '../../types'

const statusStyles = {
  approved: { background: 'var(--green-light)', color: 'var(--green)',      label: '✓ Approved' },
  pending:  { background: 'var(--amber-light)', color: 'var(--amber)',      label: '⏳ Pending'  },
  draft:    { background: 'var(--bg-subtle)',   color: 'var(--text-muted)', label: '◌ Draft'    },
}

interface DayGroupProps {
  label: string      // e.g. 'Monday, Feb 23'
  totalHours: string // e.g. '4.5h'
  entries: TimeEntry[]
}

export default function DayGroup({ label, totalHours, entries }: DayGroupProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Day header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '8px 14px',
        fontSize: '12px', fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {label}
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span style={{ color: 'var(--text)', fontSize: '13px' }}>{totalHours}</span>
      </div>

      {/* Entries */}
      {entries.map(entry => {
        const s = statusStyles[entry.status]
        return (
          <div
            key={entry.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '4px',
              display: 'flex', alignItems: 'center', gap: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.borderColor = 'var(--accent)'
              el.style.transform = 'translateX(2px)'
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.borderColor = 'var(--border)'
              el.style.transform = 'translateX(0)'
              el.style.boxShadow = 'none'
            }}
          >
            {/* Color bar */}
            <div style={{
              width: '4px', height: '36px',
              borderRadius: '2px',
              background: entry.projectColor,
              flexShrink: 0,
            }} />

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>
                {entry.project}
              </div>
              <div style={{
                fontSize: '12px', color: 'var(--text-muted)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {entry.description}
              </div>
            </div>

            {/* Status badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 9px', borderRadius: '20px',
              fontSize: '11.5px', fontWeight: 600,
              background: s.background, color: s.color,
              flexShrink: 0,
            }}>
              {s.label}
            </span>

            {/* Time meta */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text)' }}>
                {entry.duration}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {entry.startTime} – {entry.endTime}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}