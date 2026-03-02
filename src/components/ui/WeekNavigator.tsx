import { useBreakpoint } from '../../hooks/useBreakpoint'

interface WeekNavigatorProps {
  weekLabel:   string
  totalHours:  string
  onPrev:      () => void
  onNext:      () => void
  onSubmit:    () => void
  onExport:    () => void
  submitting?: boolean
}

export default function WeekNavigator({
  weekLabel, totalHours, onPrev, onNext, onSubmit, onExport, submitting,
}: WeekNavigatorProps) {
  const { isMobile } = useBreakpoint()

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: isMobile ? '12px' : '12px 18px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: isMobile ? '10px' : '12px',
    }}>

      {/* Week navigation row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <button onClick={onPrev} style={navBtnStyle}>‹</button>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: isMobile ? '16px' : '18px',
          color: 'var(--text)',
          flex: 1,
          textAlign: 'center',
        }}>
          {weekLabel}
        </div>
        <button onClick={onNext} style={navBtnStyle}>›</button>

        <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Total:&nbsp;
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{totalHours}</span>
        </span>
      </div>

      {/* Actions row */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        {!isMobile && (
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }} />
        )}

        <button
          onClick={onExport}
          style={{
            padding: '8px 16px', borderRadius: '8px',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            flex: isMobile ? 1 : 'none',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
          }}
        >
          Export CSV
        </button>

        <button
          onClick={onSubmit}
          disabled={submitting}
          style={{
            padding: '8px 16px', borderRadius: '8px',
            background: submitting ? 'var(--bg-subtle)' : 'var(--accent)',
            color: submitting ? 'var(--text-muted)' : 'white',
            border: 'none', fontFamily: 'var(--font-body)',
            fontSize: '13px', fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            flex: isMobile ? 1 : 'none',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit for Approval'}
        </button>
      </div>
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