import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import type { Page } from './types'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Timesheet from './pages/Timesheet'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import Approvals from './pages/Approvals'
import Team from './pages/Team'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'

// Inner app — only renders when user is logged in
function AuthenticatedApp() {
  const { user, loading, signOut, isAdmin } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const guardedNavigate = (page: Page) => setCurrentPage(safePage(page))
  const [pendingCount, setPendingCount] = useState(0)

  // ✅ useEffect MUST come before any early returns
  useEffect(() => {
    if (!user) return
    supabase
      .from('approvals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count ?? 0))
  }, [user])

  // Early returns AFTER all hooks
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '24px', color: 'var(--text-muted)',
      }}>
        Loading…
      </div>
    </div>
  )

  if (!user) return <Login />

    function safePage(page: Page): Page {
      if (!isAdmin && (page === 'approvals' || page === 'team')) {
        return 'dashboard'
      }
      return page
    }

  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard onNavigate={guardedNavigate} />,
    timesheet: <Timesheet />,
    projects:  <Projects />,
    reports:   <Reports />,
    approvals: <Approvals />,
    team:      <Team />,
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={guardedNavigate}
      pendingCount={pendingCount}
      onSignOut={signOut}
      userEmail={user.email ?? ''}
    >
      {pages[currentPage]}
    </Layout>
  )
}

// Outer app — wraps everything in the auth provider
export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}