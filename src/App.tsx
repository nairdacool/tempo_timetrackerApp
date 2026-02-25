import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import type { Page, Approval } from './types'
import { mockApprovals } from './data/approvalsData'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Timesheet from './pages/Timesheet'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import Approvals from './pages/Approvals'
import Team from './pages/Team'

// Inner app — only renders when user is logged in
function AuthenticatedApp() {
  const { user, loading, signOut } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [approvals, setApprovals]     = useState<Approval[]>(mockApprovals)

  const pendingCount = approvals.filter(a => a.status === 'pending').length

  // Show nothing while checking auth state
  if (loading) {
    return (
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
  }

  // Show login page if not authenticated
  if (!user) return <Login />

  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard onNavigate={setCurrentPage} />,
    timesheet: <Timesheet />,
    projects:  <Projects />,
    reports:   <Reports />,
    approvals: <Approvals approvals={approvals} onUpdate={setApprovals} />,
    team:      <Team />,
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
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