const projects = [
  { name: 'Acme Redesign',  color: '#c8602a', hours: 12.5, maxHours: 16 },
  { name: 'Backend API v2', color: '#2a5fa8', hours: 9.0,  maxHours: 16 },
  { name: 'Mobile App',     color: '#2a7a4f', hours: 7.0,  maxHours: 16 },
  { name: 'Data Pipeline',  color: '#c87d2a', hours: 4.0,  maxHours: 16 },
]

export default function ProjectsBreakdown() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Hours by Project</div>
      </div>
      {projects.map(p => (
        <div
          key={p.name}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer', transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
        >
          <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: p.color, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
          <div style={{ width: '60px', height: '4px', background: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '2px', background: p.color, width: `${(p.hours / p.maxHours) * 100}%` }} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>
            {p.hours}h
          </div>
        </div>
      ))}
    </div>
  )
}