interface WeekNavigatorProps {
  weekLabel: string
  totalHours: string
  onPrev: () => void
  onNext: () => void
  onSubmit: () => void
}

export default function WeekNavigator({ weekLabel, totalHours, onPrev, onNext, onSubmit }: WeekNavigatorProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '12px 18px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <button onClick={onPrev} style={navBtnStyle}>‹</button>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text)', flex: 1 }}>
        {weekLabel}
      </div>

      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Total:&nbsp;
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{totalHours}</span>
      </span>

      <button onClick={onNext} style={navBtnStyle}>›</button>

      <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }} />

      <button onClick={() => {}} style={{ ...navBtnStyle, padding: '6px 12px', borderRadius: '8px' }}>
        Export CSV
      </button>

      <button onClick={onSubmit} style={{
        padding: '8px 16px', borderRadius: '8px',
        background: 'var(--accent)', color: 'white',
        border: 'none', fontFamily: 'var(--font-body)',
        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      }}>
        Submit for Approval
      </button>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '6px 10px',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-body)',
  fontSize: '16px',
  lineHeight: 1,
  transition: 'background 0.15s',
}