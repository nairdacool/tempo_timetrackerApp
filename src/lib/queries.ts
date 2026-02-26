import { supabase } from './supabase'
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