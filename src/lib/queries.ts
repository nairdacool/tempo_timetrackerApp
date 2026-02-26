import { supabase } from './supabase'
import type { TimeEntry } from '../types'
import type { Project } from '../types'

// ===== PROJECTS =====

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  // Map Supabase column names to our frontend type
  return data.map(p => ({
    id: p.id,
    name: p.name,
    client: p.client,
    color: p.color,
    loggedHours: 0,       // will calculate from time_entries later
    budgetHours: p.budget_hours,
    status: p.status,
    team: [],             // will join with profiles later
  }))
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
    .select(`
      *,
      projects (name, color)
    `)
    .eq('user_id', user.id)
    .in('date', weekDates)
    .order('date', { ascending: false })
    .order('start_time', { ascending: true })

  if (error) throw new Error(error.message)

  return data.map(e => ({
    id: e.id,
    project: e.projects?.name ?? 'Unknown',
    projectColor: e.projects?.color ?? '#c8602a',
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

  const now       = new Date()
  const monday    = getThisMonday(now)
  const weekStart = monday.toISOString().slice(0, 10)
  const weekEnd   = new Date(monday.getTime() + 6 * 86400000).toISOString().slice(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Fetch this week's entries
  const { data: weekEntries, error: weekErr } = await supabase
    .from('time_entries')
    .select('duration_minutes, date, project_id')
    .eq('user_id', user.id)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if (weekErr) throw new Error(weekErr.message)

  // Fetch this month's entries
  const { data: monthEntries, error: monthErr } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .gte('date', monthStart)

  if (monthErr) throw new Error(monthErr.message)

  // Fetch active project count
  const { count: projectCount, error: projErr } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (projErr) throw new Error(projErr.message)

  // Fetch pending approvals count
  const { count: pendingCount, error: appErr } = await supabase
    .from('approvals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (appErr) throw new Error(appErr.message)

  const weekMins  = (weekEntries  ?? []).reduce((s, e) => s + e.duration_minutes, 0)
  const monthMins = (monthEntries ?? []).reduce((s, e) => s + e.duration_minutes, 0)

  return {
    weekHours:    Math.round((weekMins  / 60) * 10) / 10,
    monthHours:   Math.round((monthMins / 60) * 10) / 10,
    projectCount: projectCount ?? 0,
    pendingCount: pendingCount ?? 0,
    weekEntries:  weekEntries  ?? [],
    weekStart,
  }
}

export async function fetchRecentEntries() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      projects (name, color)
    `)
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

// ===== PRIVATE HELPERS =====

function getThisMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatEntryDate(dateStr: string): string {
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today)     return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function minsToDisplay(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`
}