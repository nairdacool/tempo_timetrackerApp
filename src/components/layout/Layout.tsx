import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

interface LayoutProps {
  children:     React.ReactNode
  onNavigate:   (path: string) => void
  pendingCount: number
  onSignOut:    () => void
  userEmail:    string
}

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard',  subtitle: 'Your overview'       },
  '/timesheet': { title: 'Timesheet',  subtitle: 'Log your hours'      },
  '/projects':  { title: 'Projects',   subtitle: 'Manage your work'    },
  '/reports':   { title: 'Reports',    subtitle: 'Analyze your time'   },
  '/approvals': { title: 'Approvals',  subtitle: 'Review timesheets'   },
  '/team':      { title: 'Team',       subtitle: 'Manage your members' },
}

export default function Layout({
  children, onNavigate, pendingCount, onSignOut, userEmail,
}: LayoutProps) {
  const location = useLocation()
  const meta = pageMeta[location.pathname] ?? { title: 'Tempo', subtitle: '' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar
        onNavigate={onNavigate}
        pendingCount={pendingCount}
        onSignOut={onSignOut}
        userEmail={userEmail}
      />
      <main style={{
        marginLeft: '240px', flex: 1,
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Topbar */}
        <div style={{
          height: '64px', padding: '0 32px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px', color: 'var(--text)',
              lineHeight: 1,
            }}>
              {meta.title}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {meta.subtitle}
            </div>
          </div>

          <button
            onClick={() => onNavigate('/timesheet')}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              background: 'var(--accent)', color: 'white',
              border: 'none', fontFamily: 'var(--font-body)',
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
          >
            + Log Time
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: '28px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}