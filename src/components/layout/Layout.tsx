import { useLocation } from 'react-router-dom'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

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
  const location   = useLocation()
  const { isMobile } = useBreakpoint()
  const meta = pageMeta[location.pathname] ?? { title: 'Tempo', subtitle: '' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Sidebar — desktop only */}
      {!isMobile && (
        <Sidebar
          onNavigate={onNavigate}
          pendingCount={pendingCount}
          onSignOut={onSignOut}
          userEmail={userEmail}
        />
      )}

      <main style={{
        marginLeft: isMobile ? 0 : '240px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        paddingBottom: isMobile ? '64px' : 0,
      }}>
        {/* Topbar */}
        <div style={{
          height: isMobile ? 'auto' : '64px',
          padding: isMobile ? '16px' : '0 32px',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '10px' : 0,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? '22px' : '20px',
              color: 'var(--text)',
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
              padding: isMobile ? '10px 0' : '9px 20px',
              width: isMobile ? '100%' : 'auto',
              borderRadius: '8px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Log Time
          </button>
        </div>

        {/* Page content */}
        <div style={{
          flex: 1,
          padding: isMobile ? '16px' : '28px 32px',
        }}>
          {children}
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      {isMobile && (
        <BottomNav
          onNavigate={onNavigate}
          pendingCount={pendingCount}
        />
      )}
    </div>
  )
}