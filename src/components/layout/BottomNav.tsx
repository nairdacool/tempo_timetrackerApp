import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

interface BottomNavProps {
  onNavigate:   (path: string) => void
  pendingCount: number
}

const navItems = [
  {
    path: '/dashboard',
    label: 'Home',
    adminOnly: false,
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  {
    path: '/timesheet',
    label: 'Time',
    adminOnly: false,
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    path: '/projects',
    label: 'Projects',
    adminOnly: false,
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  },
  {
    path: '/reports',
    label: 'Reports',
    adminOnly: false,
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    path: '/approvals',
    label: 'Approvals',
    adminOnly: true,
    badge: true,
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
]

export default function BottomNav({ onNavigate, pendingCount }: BottomNavProps) {
  const location = useLocation()
  const { isAdmin } = useAuth()

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: '64px',
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {visibleItems.map(item => {
        const isActive = location.pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'transparent',
              border: 'none',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.15s',
            }}
          >
            {item.icon}
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? 700 : 500,
              fontFamily: 'var(--font-body)',
            }}>
              {item.label}
            </span>
            {'badge' in item && item.badge && pendingCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '20%',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'white',
                fontSize: '9px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {pendingCount}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}