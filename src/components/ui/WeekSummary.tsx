const days = [
  { label: 'Mon', hours: 8.5, max: 10 },
  { label: 'Tue', hours: 8.0, max: 10 },
  { label: 'Wed', hours: 6.0, max: 10 },
  { label: 'Thu', hours: 4.0, max: 10 },
  { label: 'Fri', hours: 0,   max: 10 },
]

const total = days.reduce((sum, d) => sum + d.hours, 0)

export default function WeekSummary() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      marginBottom: '16px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
        This Week
      </div>

      {days.map(day => {
        const pct = (day.hours / day.max) * 100
        const barColor = day.hours >= 8 ? 'var(--green)' : day.hours >= 6 ? 'var(--accent)' : 'var(--amber)'
        return (
          <div key={day.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', width: '28px' }}>
              {day.label}
            </span>
            <div style={{ flex: 1, height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                background: barColor,
                width: `${pct}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '32px', textAlign: 'right' }}>
              {day.hours > 0 ? `${day.hours}h` : '—'}
            </span>
          </div>
        )
      })}

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '16px', paddingTop: '14px',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Total hours</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)' }}>{total}h</span>
      </div>
    </div>
  )
}