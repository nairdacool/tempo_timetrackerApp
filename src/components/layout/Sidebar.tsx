import { useAuth } from "../../context/useAuth";
import { useLocation } from "react-router-dom";

interface SidebarProps {
  onNavigate:   (path: string) => void 
  pendingCount: number;
  onSignOut: () => void;
  userEmail: string;
}

const navGroups = [
  {
    section: 'OVERVIEW',
    items: [
      { path: '/dashboard', label: 'Dashboard', adminOnly: false, icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
      { path: '/timesheet', label: 'Timesheet', adminOnly: false, icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    ],
  },
  {
    section: 'WORKSPACE',
    items: [
      { path: '/projects', label: 'Projects', adminOnly: false, icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
      { path: '/reports',  label: 'Reports',  adminOnly: false, icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    ],
  },
  {
    section: 'ADMIN',
    items: [
      { path: '/approvals',     label: 'Approvals',     adminOnly: true, badge: true, icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { path: '/team',          label: 'Team',          adminOnly: true,             icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
      { path: '/organizations', label: 'Organizations', adminOnly: true,             icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    ],
  },
]

export default function Sidebar({
  onNavigate,
  pendingCount,
  onSignOut,
  userEmail,
}: SidebarProps) {
  const { isAdmin, profile } = useAuth();
  const location = useLocation()

  return (
    <aside
      data-testid="sidebar"
      style={{
        width: "240px",
        height: "100vh",
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "var(--accent)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            ⏱
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "22px" }}>
            Tempo
          </span>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              background: "var(--accent-light)",
              color: "var(--accent)",
              padding: "2px 6px",
              borderRadius: "4px",
              marginLeft: "auto",
            }}
          >
            BETA
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {navGroups.map((group) => {
          // Filter items — non-admins skip adminOnly items
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || isAdmin,
          );
          // Skip the whole group if no visible items
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.section}>
              {/* Section header */}
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-placeholder)",
                  letterSpacing: "0.8px",
                  padding: "12px 8px 4px",
                  textTransform: "uppercase",
                }}
              >
                {group.section}
              </div>

              {/* Items */}
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    data-testid={`nav-item-${item.path.replace('/', '')}`}
                    onClick={() => onNavigate(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "none",
                      background: isActive
                        ? "var(--accent-light)"
                        : "transparent",
                      color: isActive ? "var(--accent)" : "var(--text-muted)",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      marginBottom: "2px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "var(--bg-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                  >
                    <span
                      style={{ width: "18px", flexShrink: 0, display: "flex" }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                    {"badge" in item && item.badge && pendingCount > 0 && (
                      <span
                        style={{
                          marginLeft: "auto",
                          background: "var(--accent)",
                          color: "white",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "10px",
                        }}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Help Center */}
      <div style={{ padding: "8px 8px 0", borderTop: "1px solid var(--border)" }}>
        <button
          data-testid="btn-help-center"
          onClick={() => onNavigate('/help')}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
        >
          <span style={{ width: "18px", flexShrink: 0, display: "flex" }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth={1} />
            </svg>
          </span>
          Help Center
        </button>
      </div>

      {/* User */}
      <div
        style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}
      >
        <div
          data-testid="btn-user-profile"
          onClick={() => onNavigate('/settings')}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px",
            cursor: "pointer",
            borderRadius: "8px",
            padding: "6px 4px",
            margin: "-6px -4px 2px",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          title="Profile settings"
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: profile?.color ?? "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {profile?.initials ?? userEmail.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile?.fullName ?? userEmail}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {profile?.role ?? "Member"}{profile?.organization ? ` · ${profile.organization}` : ''}
            </div>
          </div>
        </div>
        <button
          data-testid="btn-sign-out"
          onClick={onSignOut}
          style={{
            width: "100%",
            padding: "7px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fde8e8";
            (e.currentTarget as HTMLButtonElement).style.color = "#c03030";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "#f5c0c0";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-muted)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border)";
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
