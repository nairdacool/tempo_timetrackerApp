import StatCard from '../components/ui/StatCard'
import TimerWidget from '../components/ui/TimerWidget'
import RecentEntries from '../components/ui/RecentEntries'
import WeekSummary from '../components/ui/WeekSummary'
import ProjectsBreakdown from '../components/ui/ProjectsBreakdown'
import type { Page } from '../types'

interface DashboardProps {
  onNavigate: (page: Page) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div>
      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatCard label="This Week"          value="34.5h" delta="↑ 12% vs last week" trend="up"      />
        <StatCard label="This Month"         value="128h"  delta="↑ 5% on target"     trend="up"      />
        <StatCard label="Active Projects"    value="6"     delta="↓ 1 paused"         trend="down"    />
        <StatCard label="Pending Approvals"  value="3"     delta="→ Needs action"     trend="neutral" />
      </div>

      {/* Timer */}
      <TimerWidget />

      {/* Main grid: entries + side panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '20px',
      }}>
        <div>
          <RecentEntries onViewAll={() => onNavigate('timesheet')} />
        </div>
        <div>
          <WeekSummary />
          <ProjectsBreakdown />
        </div>
      </div>
    </div>
  )
}