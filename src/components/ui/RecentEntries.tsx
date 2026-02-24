interface Entry {
  id: number
  project: string
  projectColor: string
  description: string
  date: string
  duration: string
  status: 'approved' | 'pending' | 'draft'
}

const entries: Entry[] = [
  { id: 1, project: 'Acme Redesign',  projectColor: '#c8602a', description: 'Homepage wireframes',        date: 'Today, 09–11am',      duration: '2h 00m', status: 'approved' },
  { id: 2, project: 'Backend API v2', projectColor: '#2a5fa8', description: 'Auth endpoint refactor',     date: 'Today, 12–14pm',      duration: '2h 30m', status: 'pending'  },
  { id: 3, project: 'Mobile App',     projectColor: '#2a7a4f', description: 'Push notification setup',    date: 'Yesterday, 14–17pm',  duration: '3h 15m', status: 'approved' },
  { id: 4, project: 'Data Pipeline',  projectColor: '#c87d2a', description: 'ETL optimization',           date: 'Yesterday, 09–12pm',  duration: '2h 45m', status: 'draft'    },
]

const statusStyles = {
  approved: { background: 'var(--green-light)', color: 'var(--green)',        label: '✓ Approved' },
  pending:  { background: 'var(--amber-light)', color: 'var(--amber)',        label: '⏳ Pending'  },
  draft:    { background: 'var(--bg-subtle)',   color: 'var(--text-muted)',   label: '◌ Draft'    },
}

export default function RecentEntries({ onViewAll }: { onViewAll: () => void }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Recent Time Entries</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Today and yesterday</div>
        </div>
        <button
          onClick={onViewAll}
          style={{
            marginLeft: 'auto',
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: '13px',
            fontFamily: 'var(--font-body)', cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          View all →
        </button>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-subtle)' }}>
            {['Project', 'Description', 'Date', 'Duration', 'Status'].map(col => (
              <th key={col} style={{
                padding: '10px 16px', textAlign: 'left',
                fontSize: '11px', fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.5px', textTransform: 'uppercase',
                borderBottom: '1px solid var(--border)',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => {
            const s = statusStyles[entry.status]
            return (
              <tr
                key={entry.id}
                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
              >
                <td style={{ padding: '13px 16px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: 600,
                    background: entry.projectColor + '22',
                    color: entry.projectColor,
                  }}>
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: entry.projectColor, marginRight: '6px',
                      flexShrink: 0,
                    }} />
                    {entry.project}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '13.5px' }}>{entry.description}</td>
                <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>{entry.date}</td>
                <td style={{ padding: '13px 16px', fontFamily: 'var(--font-display)', fontSize: '16px' }}>{entry.duration}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 9px', borderRadius: '20px',
                    fontSize: '11.5px', fontWeight: 600,
                    background: s.background, color: s.color,
                  }}>
                    {s.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}