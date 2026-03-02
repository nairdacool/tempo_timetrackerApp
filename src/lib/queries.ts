import { supabase } from './supabase'
import type { TimeEntry } from '../types'
import type { Project } from '../types'

// ===== PRIVATE HELPERS =====

async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return data?.role === 'Admin'
}

// ===== PROJECTS =====

export async function fetchActiveProjects(): Promise<Project[]> {
  const admin = await isAdmin()

  let query = supabase
    .from('projects')
    .select(`*, time_entries (duration_minutes)`)
    .in('status', ['active', 'on-hold'])
    .order('created_at', { ascending: false })

  if (!admin) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user!.id)
    const ids = (memberships ?? []).map(m => m.project_id)
    if (ids.length === 0) return []
    query = query.in('id', ids)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return data.map(p => {
    const loggedMinutes = (p.time_entries ?? [])
      .reduce((sum: number, e: { duration_minutes: number }) => sum + e.duration_minutes, 0)
    return {
      id: p.id,
      name: p.name,
      client: p.client,
      color: p.color,
      loggedHours: Math.round((loggedMinutes / 60) * 10) / 10,
      budgetHours: p.budget_hours,
      status: p.status,
      team: [],
    }
  })
}

export async function fetchProjects(): Promise<Project[]> {
  const admin = await isAdmin()

  let query = supabase
    .from('projects')
    .select(`*, time_entries (duration_minutes)`)
    .order('created_at', { ascending: false })

  if (!admin) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user!.id)
    const ids = (memberships ?? []).map(m => m.project_id)
    if (ids.length === 0) return []
    query = query.in('id', ids)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return data.map(p => {
    const loggedMinutes = (p.time_entries ?? [])
      .reduce((sum: number, e: { duration_minutes: number }) => sum + e.duration_minutes, 0)
    return {
      id: p.id,
      name: p.name,
      client: p.client,
      color: p.color,
      loggedHours: Math.round((loggedMinutes / 60) * 10) / 10,
      budgetHours: p.budget_hours,
      status: p.status,
      team: [],
    }
  })
}

export async function createProject(
  project: Omit<Project, 'id' | 'team' | 'loggedHours'>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('projects')
    .insert({
      name: project.name,
      client: project.client,
      color: project.color,
      budget_hours: project.budgetHours,
      status: project.status,
      created_by: user?.id,
    })

  if (error) throw new Error(error.message)
}

// ===== TIME ENTRIES =====

export async function fetchTimeEntries(weekDates: string[]): Promise<TimeEntry[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('time_entries')
    .select(`*, projects (name, color)`)
    .eq('user_id', user.id)
    .in('date', weekDates)
    .order('date', { ascending: false })
    .order('start_time', { ascending: true })

  if (error) throw new Error(error.message)

  return data.map(e => ({
    id: e.id,
    project: e.projects?.name ?? 'Unknown',
    projectColor: e.projects?.color ?? '#c8602a',
    projectId: e.project_id,
    description: e.description,
    date: e.date,
    startTime: e.start_time.slice(0, 5),
    endTime: e.end_time.slice(0, 5),
    duration: minsToDisplay(e.duration_minutes),
    status: e.status,
  }))
}

export async function insertTimeEntry(entry: {
  projectId: string
  description: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('time_entries')
    .insert({
      user_id: user.id,
      project_id: entry.projectId,
      description: entry.description,
      date: entry.date,
      start_time: entry.startTime,
      end_time: entry.endTime,
      duration_minutes: entry.durationMinutes,
      status: 'draft',
    })

  if (error) throw new Error(error.message)
}

// ===== DASHBOARD =====

export async function fetchDashboardStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const monday = getThisMonday(now)
  const weekStart = monday.toISOString().slice(0, 10)
  const weekEnd = new Date(monday.getTime() + 6 * 86400000).toISOString().slice(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: weekEntries, error: weekErr } = await supabase
    .from('time_entries')
    .select('duration_minutes, date, project_id')
    .eq('user_id', user.id)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if (weekErr) throw new Error(weekErr.message)

  const { data: monthEntries, error: monthErr } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .gte('date', monthStart)

  if (monthErr) throw new Error(monthErr.message)

  const { count: projectCount, error: projErr } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (projErr) throw new Error(projErr.message)

  const { count: pendingCount, error: appErr } = await supabase
    .from('approvals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (appErr) throw new Error(appErr.message)

  const weekMins = (weekEntries ?? []).reduce((s, e) => s + e.duration_minutes, 0)
  const monthMins = (monthEntries ?? []).reduce((s, e) => s + e.duration_minutes, 0)

  return {
    weekHours: Math.round((weekMins / 60) * 10) / 10,
    monthHours: Math.round((monthMins / 60) * 10) / 10,
    projectCount: projectCount ?? 0,
    pendingCount: pendingCount ?? 0,
    weekEntries: weekEntries ?? [],
    weekStart,
  }
}

export async function fetchRecentEntries() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('time_entries')
    .select(`*, projects (name, color)`)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(5)

  if (error) throw new Error(error.message)

  return data.map(e => ({
    id: e.id,
    project: e.projects?.name ?? 'Unknown',
    projectColor: e.projects?.color ?? '#c8602a',
    description: e.description,
    date: formatEntryDate(e.date),
    duration: minsToDisplay(e.duration_minutes),
    status: e.status as 'approved' | 'pending' | 'draft',
  }))
}

// ===== REPORTS =====

export async function fetchReportData(startDate: string, endDate: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('time_entries')
    .select(`*, projects (name, client, color, budget_hours, status)`)
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

// ===== APPROVALS =====

export async function fetchApprovals() {
  const { data, error } = await supabase
    .from('approvals')
    .select(`*, profiles!approvals_user_id_fkey (full_name, initials, color, role)`)
    .order('submitted_at', { ascending: false })

  if (error) throw new Error(error.message)

  const approvalsWithCounts = await Promise.all(
    data.map(async a => {
      const { data: entries } = await supabase
        .from('time_entries')
        .select(`*, projects (name, color)`)
        .eq('user_id', a.user_id)
        .gte('date', a.week_start)
        .lte('date', a.week_end)

      const entryList = entries ?? []

      const projectMap = new Map<string, { name: string; color: string; minutes: number }>()
      entryList.forEach((e: any) => {
        const key = e.project_id
        const existing = projectMap.get(key)
        if (existing) {
          existing.minutes += e.duration_minutes
        } else {
          projectMap.set(key, {
            name: e.projects?.name ?? 'Unknown',
            color: e.projects?.color ?? '#c8602a',
            minutes: e.duration_minutes,
          })
        }
      })

      const projectSummaries = Array.from(projectMap.values()).map(p => ({
        name: p.name,
        color: p.color,
        hours: Math.round((p.minutes / 60) * 10) / 10,
      }))

      return {
        id: a.id,
        userName: a.profiles?.full_name ?? 'Unknown',
        userInitials: a.profiles?.initials ?? '??',
        userColor: a.profiles?.color ?? '#c8602a',
        userRole: a.profiles?.role ?? 'Developer',
        weekLabel: formatWeekLabel(a.week_start, a.week_end),
        weekStart: a.week_start,
        weekEnd: a.week_end,
        userId: a.user_id,
        totalHours: a.total_hours,
        projects: projectSummaries,
        entryCount: entryList.length,
        submittedDate: new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: a.status as 'pending' | 'approved' | 'rejected',
      }
    })
  )

  return approvalsWithCounts
}

export async function submitWeekForApproval(weekStart: string, weekEnd: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: entries, error: entriesErr } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if (entriesErr) throw new Error(entriesErr.message)

  const totalMins = (entries ?? []).reduce((s, e) => s + e.duration_minutes, 0)
  const totalHours = Math.round((totalMins / 60) * 10) / 10

  const { data: existing } = await supabase
    .from('approvals')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('approvals')
      .update({ status: 'pending', total_hours: totalHours, submitted_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('approvals')
      .insert({ user_id: user.id, week_start: weekStart, week_end: weekEnd, total_hours: totalHours, status: 'pending' })
    if (error) throw new Error(error.message)
  }

  await supabase
    .from('time_entries')
    .update({ status: 'pending' })
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .gte('date', weekStart)
    .lte('date', weekEnd)
}

export async function updateApprovalStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
  const { data: approval, error: fetchErr } = await supabase
    .from('approvals')
    .select('user_id, week_start, week_end')
    .eq('id', id)
    .single()

  if (fetchErr) throw new Error(fetchErr.message)

  const { error: approvalErr } = await supabase
    .from('approvals')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (approvalErr) throw new Error(approvalErr.message)

  const { error: entriesErr } = await supabase
    .from('time_entries')
    .update({ status })
    .eq('user_id', approval.user_id)
    .gte('date', approval.week_start)
    .lte('date', approval.week_end)

  if (entriesErr) throw new Error(entriesErr.message)
}

// ===== PROJECT MEMBERS =====

export async function fetchProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .select(`*, profiles (id, full_name, initials, color, role)`)
    .eq('project_id', projectId)

  if (error) throw new Error(error.message)
  return (data ?? []).map(m => m.profiles)
}

export async function addProjectMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId })
  if (error) throw new Error(error.message)
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ===== EDITING ENTRIES =====

export async function updateTimeEntry(id: string, entry: {
  projectId: string
  description: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
}): Promise<void> {
  const { error } = await supabase
    .from('time_entries')
    .update({
      project_id: entry.projectId,
      description: entry.description,
      date: entry.date,
      start_time: entry.startTime,
      end_time: entry.endTime,
      duration_minutes: entry.durationMinutes,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const { error } = await supabase.from('time_entries').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ===== EDITING PROJECTS =====

export async function updateProject(id: string, updates: {
  name: string
  color: string
  budgetHours: number
  status: string
}): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({
      name: updates.name,
      color: updates.color,
      budget_hours: updates.budgetHours,
      status: updates.status,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ===== APPROVAL DETAILS =====

export async function fetchEntriesForApproval(userId: string, weekStart: string, weekEnd: string) {
  const { data, error } = await supabase
    .from('time_entries')
    .select(`*, projects (name, color)`)
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

// ===== HELPERS =====

function getThisMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatEntryDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function minsToDisplay(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`
}

function formatWeekLabel(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}`
}