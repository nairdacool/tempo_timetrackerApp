import { useState } from 'react'
import type { TimeEntry } from '../types'
import { mockEntries } from '../data/timesheetData'
import WeekNavigator from '../components/ui/WeekNavigator'
import EntryForm from '../components/ui/EntryForm'
import DayGroup from '../components/ui/DayGroup'

// Week labels for navigation (we'll keep it simple with static labels for now)
const weeks = [
  { label: 'Feb 10 – Feb 16, 2026', dates: ['2026-02-10','2026-02-11','2026-02-12','2026-02-13','2026-02-14'] },
  { label: 'Feb 17 – Feb 23, 2026', dates: ['2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21','2026-02-22','2026-02-23'] },
  { label: 'Feb 24 – Mar 02, 2026', dates: ['2026-02-24','2026-02-25','2026-02-26','2026-02-27','2026-02-28'] },
]

// Format 'YYYY-MM-DD' → 'Monday, Feb 23'
function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// Parse 'Xh YYm' → total minutes
function durationToMins(dur: string): number {
  const h = parseInt(dur.match(/(\d+)h/)?.[1] ?? '0')
  const m = parseInt(dur.match(/(\d+)m/)?.[1] ?? '0')
  return h * 60 + m
}

// Format total minutes → 'Xh Ym'
function minsToLabel(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function Timesheet() {
  const [weekIndex, setWeekIndex]   = useState(1) // start on current week
  const [entries, setEntries]       = useState<TimeEntry[]>(mockEntries)
  const [submitted, setSubmitted]   = useState(false)

  const currentWeek = weeks[weekIndex]

  // Filter entries to only those in the current week
  const weekEntries = entries.filter(e => currentWeek.dates.includes(e.date))

  // Group entries by date, sorted newest first
  const grouped = currentWeek.dates
    .slice()
    .reverse()
    .map(date => ({
      date,
      label: formatDayLabel(date),
      entries: weekEntries.filter(e => e.date === date),
    }))
    .filter(g => g.entries.length > 0)

  // Calculate total hours for the week
  const totalMins = weekEntries.reduce((sum, e) => sum + durationToMins(e.duration), 0)
  const totalHours = minsToLabel(totalMins)

  function handleAddEntry(entry: TimeEntry) {
    setEntries(prev => [entry, ...prev])
    setSubmitted(false)
  }

  function handleSubmit() {
    setEntries(prev =>
      prev.map(e =>
        currentWeek.dates.includes(e.date) && e.status === 'draft'
          ? { ...e, status: 'pending' }
          : e
      )
    )
    setSubmitted(true)
  }

  return (
    <div>
      <WeekNavigator
        weekLabel={currentWeek.label}
        totalHours={totalHours}
        onPrev={() => setWeekIndex(i => Math.max(0, i - 1))}
        onNext={() => setWeekIndex(i => Math.min(weeks.length - 1, i + 1))}
        onSubmit={handleSubmit}
      />

      {submitted && (
        <div style={{
          background: 'var(--green-light)', color: 'var(--green)',
          border: '1px solid var(--green)',
          borderRadius: '10px', padding: '12px 16px',
          fontSize: '13px', fontWeight: 600,
          marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          ✓ Timesheet submitted for approval — draft entries are now pending review.
        </div>
      )}

      <EntryForm onAdd={handleAddEntry} />

      {grouped.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px',
          color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '20px',
        }}>
          No entries this week yet
        </div>
      ) : (
        grouped.map(group => (
          <DayGroup
            key={group.date}
            label={group.label}
            totalHours={minsToLabel(group.entries.reduce((sum, e) => sum + durationToMins(e.duration), 0))}
            entries={group.entries}
          />
        ))
      )}
    </div>
  )
}