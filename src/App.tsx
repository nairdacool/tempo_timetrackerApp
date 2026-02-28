import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './context/useAuth'
import { AuthProvider } from './context/AuthContext'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Timesheet from './pages/Timesheet'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import Approvals from './pages/Approvals'
import Team from './pages/Team'

function AuthenticatedApp() {
  const { user, loading, signOut, isAdmin } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) return
    supabase
      .from('approvals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count ?? 0))
  }, [user])

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

  // Redirect non-admins away from admin pages
  const adminOnly = ['/approvals', '/team']
  if (!isAdmin && adminOnly.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Layout
      onNavigate={(path) => navigate(path)}
      pendingCount={pendingCount}
      onSignOut={signOut}
      userEmail={user.email ?? ''}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard onNavigate={navigate} />} />
        <Route path="/timesheet"  element={<Timesheet />} />
        <Route path="/projects"   element={<Projects />} />
        <Route path="/reports"    element={<Reports />} />
        <Route path="/approvals"  element={<Approvals />} />
        <Route path="/team"       element={<Team />} />
        <Route path="*"           element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}