import type { WeekBar } from '../../types'

interface HoursChartProps {
  bars: WeekBar[]
  periodLabel: string
}

export default function HoursChart({ bars, periodLabel }: HoursChartProps) {
  const maxHours = Math.max(...bars.map(b => b.hours))

  // Pick bar color based on hours relative to max
  function barColor(hours: number): string {
    const ratio = hours / maxHours
    if (ratio >= 0.9) return 'var(--green)'
    if (ratio >= 0.6) return 'var(--accent)'
    return 'var(--amber)'
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      marginBottom: '20px',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Hours per Week</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{periodLabel}</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '24px 20px 12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: bars.length > 4 ? '8px' : '16px',
          height: '140px',
        }}>
          {bars.map((bar, i) => {
            const heightPct = (bar.hours / maxHours) * 100
            return (
              <div
                key={i}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}
              >
                {/* Hours label on top */}
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {bar.hours}h
                </div>
                {/* Bar */}
                <div
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    borderRadius: '4px 4px 0 0',
                    background: barColor(bar.hours),
                    opacity: 0.85,
                    transition: 'opacity 0.2s, transform 0.2s',
                    cursor: 'pointer',
                    minHeight: '4px',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.opacity = '1'
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'scaleY(1.03)'
                    ;(e.currentTarget as HTMLDivElement).style.transformOrigin = 'bottom'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.opacity = '0.85'
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'scaleY(1)'
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* X axis labels */}
        <div style={{
          display: 'flex',
          gap: bars.length > 4 ? '8px' : '16px',
          borderTop: '1px solid var(--border)',
          paddingTop: '8px',
          marginTop: '4px',
        }}>
          {bars.map((bar, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {bar.label}
            </div>
          ))}
        </div>
      </div>

      {/* Summary footer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        background: 'var(--bg-subtle)',
        borderTop: '1px solid var(--border)',
      }}>
        {[
          { label: 'Total Hours',   value: `${bars.reduce((s, b) => s + b.hours, 0)}h` },
          { label: 'Avg per Week',  value: `${Math.round(bars.reduce((s, b) => s + b.hours, 0) / bars.length)}h` },
          { label: 'Peak Week',     value: `${maxHours}h` },
        ].map(item => (
          <div key={item.label} style={{ padding: '14px 20px', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
              {item.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}