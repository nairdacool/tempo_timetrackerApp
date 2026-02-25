import { useState } from 'react'
import type { ReportPeriod } from '../types'
import { weekBars, projectSummaries, periodLabels } from '../data/reportsData'
import PeriodFilter from '../components/ui/PeriodFilter'
import HoursChart from '../components/ui/HoursChart'
import ProjectBreakdownTable from '../components/ui/ProjectBreakdownTable'

export default function Reports() {
  const [period,    setPeriod]    = useState<ReportPeriod>('this-month')
  const [dateFrom,  setDateFrom]  = useState('2026-02-01')
  const [dateTo,    setDateTo]    = useState('2026-02-28')

  // For custom period, use the date range as the label
  const periodLabel = period === 'custom'
    ? `${dateFrom} → ${dateTo}`
    : periodLabels[period]

  // For custom we show empty state until user has set dates
  const bars      = weekBars[period]
  const summaries = projectSummaries[period]

  const totalHours    = summaries.reduce((s, p) => s + p.hours, 0)
  const billableHours = summaries.filter(p => p.billable).reduce((s, p) => s + p.hours, 0)
  const billablePct   = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0
  const avgPerDay     = totalHours > 0 ? Math.round((totalHours / 20) * 10) / 10 : 0

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '12px', marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <PeriodFilter active={period} onChange={setPeriod} />

        {/* Custom date range inputs — only shown when Custom is selected */}
        {period === 'custom' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            padding: '4px 12px',
            animation: 'fadeIn 0.2s ease',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              From
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={dateInputStyle}
            />
            <span style={{ color: 'var(--text-placeholder)', fontSize: '14px' }}>→</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              To
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={dateInputStyle}
            />
            {/* Apply button — in future this will fetch filtered data */}
            <button style={{
              padding: '5px 12px', borderRadius: '6px',
              background: 'var(--accent)', color: 'white',
              border: 'none', fontFamily: 'var(--font-body)',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              Apply
            </button>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button style={exportBtnStyle}>Export PDF</button>
        <button style={exportBtnStyle}>Export CSV</button>
      </div>

      {/* Custom period empty state */}
      {period === 'custom' && summaries.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '10px' }}>
            Select a date range
          </div>
          <div style={{ fontSize: '13px' }}>
            Choose a From and To date above, then hit Apply to load your report.
          </div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-placeholder)' }}>
            (Custom range data fetching will be wired up once we connect Supabase)
          </div>
        </div>
      ) : (
        <>
          {/* Summary stat cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}>
            {[
              { label: 'Total Hours',    value: `${totalHours}h`,      sub: periodLabel              },
              { label: 'Billable Hours', value: `${billableHours}h`,   sub: `${billablePct}% of total` },
              { label: 'Avg per Day',    value: `${avgPerDay}h`,       sub: 'Working days'           },
              { label: 'Projects',       value: `${summaries.length}`, sub: 'Tracked this period'    },
            ].map(card => (
              <div key={card.label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '8px' }}>
                  {card.label}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '30px', color: 'var(--text)', lineHeight: 1, marginBottom: '6px' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          <HoursChart bars={bars} periodLabel={periodLabel} />
          <ProjectBreakdownTable summaries={summaries} />
        </>
      )}
    </div>
  )
}

const exportBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: '8px',
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px', fontWeight: 600,
  cursor: 'pointer',
}

const dateInputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '13px', color: 'var(--text)',
  background: 'transparent',
  border: 'none', outline: 'none',
  cursor: 'pointer',
}