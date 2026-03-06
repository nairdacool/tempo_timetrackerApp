import type { ProjectSummary } from '../../types'
import { useBreakpoint } from '../../hooks/useBreakpoint'

interface ProjectBreakdownTableProps {
  summaries: ProjectSummary[]
}

const statusStyles: Record<string, { background: string; color: string; label: string }> = {
  'active':    { background: 'var(--green-light)', color: 'var(--green)',  label: 'Active'    },
  'on-hold':   { background: 'var(--amber-light)', color: 'var(--amber)',  label: 'On Hold'   },
  'completed': { background: '#e8f0fe',            color: '#1a4fb5',       label: 'Completed' },
  'archived':  { background: '#D0D3DA',            color: '#6b6b80',       label: 'Archived'  },
}

export default function ProjectBreakdownTable({ summaries }: ProjectBreakdownTableProps) {
  const totalHours    = summaries.reduce((s, p) => s + p.hours, 0)
  const billableHours = summaries.filter(p => p.billable).reduce((s, p) => s + p.hours, 0)
  const billablePct   = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0
  const { isMobile }  = useBreakpoint()

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Hours by Project</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {billablePct}% billable · {totalHours}h total
          </div>
        </div>
        {!isMobile && (
          <button data-testid="btn-group-by-team" style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
            Group by Team
          </button>
        )}
      </div>

      {/* Mobile: cards */}
      {isMobile ? (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {summaries.map(p => {
            const pct    = Math.round((p.hours / p.budgetHours) * 100)
            const isOver = pct >= 100
            const s      = statusStyles[p.status] ?? { background: '#f0f0f4', color: '#6b6b80', label: p.status }
            return (
              <div key={p.name} style={{
                padding: '14px', borderRadius: '10px',
                background: 'var(--bg-subtle)',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                {/* Top row: name + status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{p.name}</span>
                  </div>
                  <span style={{
                    padding: '3px 9px', borderRadius: '20px',
                    fontSize: '11.5px', fontWeight: 600,
                    background: s.background, color: s.color,
                  }}>
                    {s.label}
                  </span>
                </div>

                {/* Client */}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.client}</div>

                {/* Budget bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Budget used</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isOver ? '#e05050' : 'var(--text-muted)' }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      width: `${Math.min(pct, 100)}%`,
                      background: isOver ? '#e05050' : p.color,
                    }} />
                  </div>
                </div>

                {/* Hours + Billable */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Hours</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>{p.hours}h</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Billable</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: p.billable ? 'var(--green)' : 'var(--text-muted)' }}>
                      {p.billable ? '100%' : '0%'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Desktop: table
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)' }}>
              {['Project', 'Client', 'Hours', 'Budget', 'Billable', 'Status'].map(col => (
                <th key={col} style={{
                  padding: '10px 16px', textAlign: 'left',
                  fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  borderBottom: '1px solid var(--border)',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.map(p => {
              const pct    = Math.round((p.hours / p.budgetHours) * 100)
              const isOver = pct >= 100
              const s      = statusStyles[p.status] ?? { background: '#f0f0f4', color: '#6b6b80', label: p.status }
              return (
                <tr
                  key={p.name}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text)' }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>{p.client}</td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text)' }}>{p.hours}h</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '70px', height: '5px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '3px', width: `${Math.min(pct, 100)}%`, background: isOver ? '#e05050' : p.color }} />
                      </div>
                      <span style={{ fontSize: '12px', color: isOver ? '#e05050' : 'var(--text-muted)', fontWeight: 600 }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: p.billable ? 'var(--green)' : 'var(--text-muted)' }}>
                      {p.billable ? '100%' : '0%'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
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
      )}
    </div>
  )
}