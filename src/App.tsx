import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
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

    // Re-fetch whenever any approval row changes
    const channel = supabase
      .channel('approvals-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, fetchPending)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Notify the current user when one of their time entries is approved or rejected.
  // We listen on time_entries (not approvals) because Supabase Realtime respects RLS —
  // non-admin users have no SELECT on others' approvals rows, so postgres_changes
  // on the approvals table is silently dropped before it reaches non-admin clients.
  // Users always have access to their own time_entries, so this is reliable.
  const knownEntryStatuses = useRef<Map<string, string>>(new Map())
  const notifyTimer        = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Map of weekKey (mondayISO_status) → status, collects all updates in the debounce window
  const pendingNotify      = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!user) return

    // Seed current statuses for the last 60 days so page-load doesn't fire stale toasts
    const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)
    supabase
      .from('time_entries')
      .select('id, status')
      .eq('user_id', user.id)
      .gte('date', since)
      .then(({ data }) => {
        ;(data ?? []).forEach(e => knownEntryStatuses.current.set(e.id, e.status))
      })

    const channel = supabase
      .channel('entry-status-notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'time_entries' },
        (payload) => {
          const row = payload.new as { id: string; user_id: string; status: string; date: string }
          if (row.user_id !== user.id) return

          const prev = knownEntryStatuses.current.get(row.id)
          knownEntryStatuses.current.set(row.id, row.status)

          if (prev === row.status) return
          if (row.status !== 'approved' && row.status !== 'rejected') return

          // Derive the Monday of this entry's week as a stable key
          const d = new Date(row.date + 'T00:00:00')
          const diff = d.getDay() === 0 ? -6 : 1 - d.getDay()
          const monday = new Date(d)
          monday.setDate(d.getDate() + diff)
          const weekKey = `${monday.toISOString().slice(0, 10)}_${row.status}`

          if (pendingNotify.current.has(weekKey)) return
          pendingNotify.current.set(weekKey, row.status)

          // Debounce: collapse multiple simultaneous entry updates into one toast per week
          if (notifyTimer.current) clearTimeout(notifyTimer.current)
          notifyTimer.current = setTimeout(() => {
            pendingNotify.current.forEach((status, key) => {
              const mondayStr = key.split('_')[0]
              const mondayDate = new Date(mondayStr + 'T00:00:00')
              const sundayDate = new Date(mondayDate.getTime() + 6 * 86400000)
              const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const weekLabel = `${fmt(mondayDate)} – ${fmt(sundayDate)}`

              if (status === 'approved') {
                toast.success(`✓ Timesheet approved\n${weekLabel}`, {
                  duration: 5000,
                  style: { whiteSpace: 'pre-line' },
                })
              } else if (status === 'rejected') {
                toast.error(`✗ Timesheet rejected\n${weekLabel}`, {
                  duration: 7000,
                  style: { whiteSpace: 'pre-line' },
                })
              }
            })
            pendingNotify.current.clear()
          }, 500)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (notifyTimer.current) clearTimeout(notifyTimer.current)
    }
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