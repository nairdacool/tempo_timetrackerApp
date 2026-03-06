import { useBreakpoint } from '../../hooks/useBreakpoint'

interface WeekNavigatorProps {
  weekLabel:    string
  totalHours:   string
  onPrev:       () => void
  onNext:       () => void
  onSubmit:     () => void
  onExport:     () => void
  submitting?:  boolean
  canSubmit?:   boolean
}

export default function WeekNavigator({
  weekLabel, totalHours, onPrev, onNext, onSubmit, onExport, submitting, canSubmit = true,
}: WeekNavigatorProps) {
  const { isMobile } = useBreakpoint()

  return (
    <div data-testid="week-navigator" style={{
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
        <button data-testid="btn-prev-week" onClick={onPrev} style={navBtnStyle}>‹</button>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: isMobile ? '16px' : '18px',
          color: 'var(--text)',
          flex: 1,
          textAlign: 'center',
        }}>
          {weekLabel}
        </div>
        <button data-testid="btn-next-week" onClick={onNext} style={navBtnStyle}>›</button>

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
          data-testid="btn-export-csv"
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
          data-testid="btn-submit-timesheet"
          onClick={onSubmit}
          disabled={submitting || !canSubmit}
          title={!canSubmit ? 'No draft entries to submit' : undefined}
          style={{
            padding: '8px 16px', borderRadius: '8px',
            background: (submitting || !canSubmit) ? 'var(--bg-subtle)' : 'var(--accent)',
            color: (submitting || !canSubmit) ? 'var(--text-muted)' : 'white',
            border: 'none', fontFamily: 'var(--font-body)',
            fontSize: '13px', fontWeight: 600,
            cursor: (submitting || !canSubmit) ? 'not-allowed' : 'pointer',
            flex: isMobile ? 1 : 'none',
            opacity: !canSubmit ? 0.5 : 1,
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