import type { ReportPeriod } from '../../types'

const options: { id: ReportPeriod; label: string }[] = [
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'q1',         label: 'Q1 2026'   },
  { id: 'custom',     label: 'Custom'    },
]

interface PeriodFilterProps {
  active: ReportPeriod
  onChange: (period: ReportPeriod) => void
}

export default function PeriodFilter({ active, onChange }: PeriodFilterProps) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '4px',
      gap: '2px',
    }}>
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '12px', fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: active === opt.id ? 'var(--accent)' : 'transparent',
            color:      active === opt.id ? 'white'         : 'var(--text-muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}