import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from './context/useAuth'
import { AuthProvider } from './context/AuthContext'
import { supabase } from './lib/supabase'
import toast from 'react-hot-toast'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
// Capture hash BEFORE Supabase JS processes and clears it on load
const _initialHash = window.location.hash
const _isInviteLink = _initialHash.includes('type=invite')

import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Timesheet from './pages/Timesheet'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import Approvals from './pages/Approvals'
import Team from './pages/Team'
import Organizations from './pages/Organizations'
import Settings from './pages/Settings'

function AuthenticatedApp() {
  const { user, loading, signOut, isAdmin } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [needsPassword, setNeedsPassword] = useState(_isInviteLink)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) return

    function fetchPending() {
      supabase
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .then(({ count }) => setPendingCount(count ?? 0))
    }

    fetchPending()
    // Poll every 15s — avoids Supabase Realtime REPLICA IDENTITY / RLS issues
    const interval = setInterval(fetchPending, 15000)
    return () => clearInterval(interval)
  }, [user])

  // Poll the approvals table every 10s to notify user of status changes on any page.
  // Polling is used instead of Supabase Realtime to avoid REPLICA IDENTITY / RLS
  // configuration requirements that silently break realtime delivery.
  const knownApprovalStatuses = useRef<Map<string, string>>(new Map())
  const notifiedApprovals     = useRef<Set<string>>(new Set())

  const checkApprovalNotifications = useCallback(async (isInitial = false) => {
    if (!user || isAdmin) return
    const { data } = await supabase
      .from('approvals')
      .select('id, status, week_start, week_end')
      .eq('user_id', user.id)
      .in('status', ['approved', 'rejected'])
      .order('week_start', { ascending: false })
      .limit(20)

    if (!data) return

    data.forEach(a => {
      const prev = knownApprovalStatuses.current.get(a.id)
      knownApprovalStatuses.current.set(a.id, a.status)

      // On first load, just seed — don't toast for existing statuses
      if (isInitial) return
      if (prev === a.status) return
      if (notifiedApprovals.current.has(`${a.id}_${a.status}`)) return
      notifiedApprovals.current.add(`${a.id}_${a.status}`)

      const start = new Date(a.week_start + 'T00:00:00')
      const end   = new Date(a.week_end   + 'T00:00:00')
      const fmt   = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const label = `${fmt(start)} – ${fmt(end)}`

      if (a.status === 'approved') {
        toast.success(`✓ Timesheet approved\n${label}`, { duration: 5000, style: { whiteSpace: 'pre-line' } })
      } else if (a.status === 'rejected') {
        toast.error(`✗ Timesheet rejected\n${label}`, { duration: 7000, style: { whiteSpace: 'pre-line' } })
      }
    })
  }, [user, isAdmin])

  useEffect(() => {
    if (!user || isAdmin) return
    knownApprovalStatuses.current.clear()
    notifiedApprovals.current.clear()
    checkApprovalNotifications(true)
    const interval = setInterval(() => checkApprovalNotifications(false), 10000)
    return () => clearInterval(interval)
  }, [user, isAdmin, checkApprovalNotifications])

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

  if (needsPassword) {
    return <SetPassword onDone={() => {
      setNeedsPassword(false)
      navigate('/dashboard', { replace: true })
    }} />
  }

  // Redirect non-admins away from admin pages
  const adminOnly = ['/approvals', '/team', '/organizations']
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
        <Route path="/approvals"      element={<Approvals />} />
        <Route path="/team"           element={<Team />} />
        <Route path="/organizations"  element={<Organizations />} />
        <Route path="/settings"       element={<Settings />} />
        <Route path="*"               element={<Navigate to="/dashboard" replace />} />
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