import type { Page } from '../../types'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
}

interface NavGroup {
  section: string
  items: NavItem[]
}

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const navItems = [
  {
    section: 'Overview',
    items: [
      {
        id: 'dashboard', label: 'Dashboard',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
      },
      {
        id: 'timesheet', label: 'Timesheet',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      },
    ]
  },
  {
    section: 'Workspace',
    items: [
      {
        id: 'projects', label: 'Projects',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
      },
      {
        id: 'reports', label: 'Reports',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      },
    ]
  },
  {
    section: 'Admin',
    items: [
      {
        id: 'approvals', label: 'Approvals', badge: 3,
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      },
      {
        id: 'team', label: 'Team',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
      },
    ]
  },
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside style={{
      width: '240px',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'var(--accent)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px'
          }}>⏱</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>Tempo</span>
          <span style={{
            fontSize: '10px', background: 'var(--accent-light)',
            color: 'var(--accent)', padding: '2px 6px',
            borderRadius: '4px', fontWeight: 600,
            letterSpacing: '0.5px', marginLeft: 'auto'
          }}>BETA</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(group => (
          <div key={group.section}>
            <div style={{
              fontSize: '10px', fontWeight: 600,
              color: 'var(--text-placeholder)',
              letterSpacing: '1px', textTransform: 'uppercase',
              padding: '12px 8px 6px'
            }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as Page)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '8px',
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                    border: 'none', fontFamily: 'var(--font-body)',
                    fontSize: '13.5px', fontWeight: 500,
                    background: isActive ? 'var(--accent-light)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                  {'badge' in item && item.badge && (
                    <span style={{
                      marginLeft: 'auto', background: 'var(--accent)',
                      color: 'white', fontSize: '10px', fontWeight: 700,
                      padding: '1px 6px', borderRadius: '10px'
                    }}>{item.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--amber))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: 'white'
        }}>JD</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>Jane Doe</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin · Acme Corp</div>
        </div>
      </div>
    </aside>
  )
}