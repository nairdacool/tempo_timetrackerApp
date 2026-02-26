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

// Helper used internally
function minsToDisplay(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`
}