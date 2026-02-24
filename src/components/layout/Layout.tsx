import Sidebar from './Sidebar'
import type{ Page } from '../../types'

const pageTitles: Record<Page, { title: string; subtitle: string }> = {
  dashboard:  { title: 'Dashboard',  subtitle: 'Monday, Feb 23 · Week 8' },
  timesheet:  { title: 'Timesheet',  subtitle: 'Feb 17 – Feb 23, 2026' },
  projects:   { title: 'Projects',   subtitle: '6 active projects' },
  reports:    { title: 'Reports',    subtitle: 'February 2026' },
  approvals:  { title: 'Approvals',  subtitle: '3 pending reviews' },
  team:       { title: 'Team',       subtitle: '4 members' },
}

interface LayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { title, subtitle } = pageTitles[currentPage]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      <main style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{
          height: '60px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 28px', gap: '16px',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>{title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => onNavigate('timesheet')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              background: 'var(--accent)', color: 'white',
              border: 'none', fontFamily: 'var(--font-body)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
            + Log Time
          </button>
        </header>

        {/* Page content */}
        <div style={{ padding: '28px', flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}