interface StatCardProps {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'neutral'
}

export default function StatCard({ label, value, delta, trend }: StatCardProps) {
  const deltaColors = {
    up:      { background: 'var(--green-light)', color: 'var(--green)' },
    down:    { background: 'var(--amber-light)', color: 'var(--amber)' },
    neutral: { background: 'var(--blue-light)',  color: 'var(--blue)'  },
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{
        fontSize: '11.5px', fontWeight: 600,
        color: 'var(--text-muted)',
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        marginBottom: '10px',
      }}>
        {label}
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '32px',
        color: 'var(--text)',
        lineHeight: 1,
        marginBottom: '10px',
      }}>
        {value}
      </div>

      <span style={{
        fontSize: '11.5px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 7px',
        borderRadius: '20px',
        ...deltaColors[trend],
      }}>
        {delta}
      </span>
    </div>
  )
}