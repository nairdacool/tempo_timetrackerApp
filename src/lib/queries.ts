import { supabase } from './supabase'
import type { TimeEntry } from '../types'
import type { Project, Organization, Client } from '../types'

// ===== PRIVATE HELPERS =====

// Accepts a pre-resolved userId to avoid a duplicate getUser() round trip
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role === 'Admin'
}

// Shared implementation for fetchActiveProjects / fetchProjects
async function fetchProjectsBase(activeOnly: boolean): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const admin = await isAdmin(user.id)

  let query = supabase
    .from('projects')
    .select(`*, time_entries (duration_minutes), clients (name)`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.in('status', ['active', 'on-hold'])
  }

  if (admin) {
    query = query.eq('created_by', user.id)
  } else {
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
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
      client: (p.clients as { name: string } | null)?.name ?? p.client ?? '',
      clientId: p.client_id ?? undefined,
      color: p.color,
      loggedHours: Math.round((loggedMinutes / 60) * 10) / 10,
      budgetHours: p.budget_hours,
      billable: p.billable ?? true,
      status: p.status,
      team: [],
      organizationId: p.organization_id ?? undefined,
    }
  })
}

// ===== PROJECTS =====

export async function fetchActiveProjects(): Promise<Project[]> {
  return fetchProjectsBase(true)
}

export async function fetchProjects(): Promise<Project[]> {
  return fetchProjectsBase(false)
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
      client_id: project.clientId ?? null,
      color: project.color,
      budget_hours: project.budgetHours,
      billable: project.billable,
      status: project.status,
      created_by: user?.id,
      ...(project.organizationId ? { organization_id: project.organizationId } : {}),
    })

  if (error) throw new Error(error.message)
}

// ===== TIME ENTRIES =====

export async function fetchTimeEntries(weekDates: string[], targetUserId?: string): Promise<TimeEntry[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const userId = targetUserId ?? user.id

  const { data, error } = await supabase
    .from('time_entries')
    .select(`*, projects (name, color)`)
    .eq('user_id', userId)
    .in('date', weekDates)
    .order('date', { ascending: true })
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

export async function fetchWeekRejectionReason(
  weekStart: string,
  weekEnd: string,
  targetUserId?: string
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const userId = targetUserId ?? user.id

  const { data } = await supabase
    .from('approvals')
    .select('rejection_reason')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .eq('week_end', weekEnd)
    .eq('status', 'rejected')
    .maybeSingle()

  return data?.rejection_reason ?? null
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
  const lastMonday = new Date(monday.getTime() - 7 * 86400000)
  const lastWeekStart = lastMonday.toISOString().slice(0, 10)
  const lastWeekEnd = new Date(lastMonday.getTime() + 6 * 86400000).toISOString().slice(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Batch 1: all time-entry aggregates + role check in parallel
  const [
    { data: weekEntries, error: weekErr },
    { data: lastWeekEntries },
    { data: monthEntries, error: monthErr },
    { data: profileData },
  ] = await Promise.all([
    supabase
      .from('time_entries')
      .select('duration_minutes, date, project_id')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase
      .from('time_entries')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('date', lastWeekStart)
      .lte('date', lastWeekEnd),
    supabase
      .from('time_entries')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('date', monthStart),
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single(),
  ])

  if (weekErr) throw new Error(weekErr.message)
  if (monthErr) throw new Error(monthErr.message)

  const admin = profileData?.role === 'Admin'

  // Batch 2: project count + pending approvals in parallel
  const [projectCountResult, pendingCountResult] = await Promise.all([
    admin
      ? supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .in('status', ['active', 'on-hold'])
          .is('deleted_at', null)
      : supabase
          .from('project_members')
          .select('project_id, projects!inner(status, deleted_at)', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('projects.status', ['active', 'on-hold'])
          .is('projects.deleted_at', null),
    // Admins see total pending submissions from their whole team.
    // Non-admins see how many of their own timesheets are pending.
    admin
      ? supabase
          .from('approvals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      : supabase
          .from('approvals')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending'),
  ])

  if (projectCountResult.error) throw new Error(projectCountResult.error.message)
  if (pendingCountResult.error) throw new Error(pendingCountResult.error.message)

  const projectCount = projectCountResult.count ?? 0
  const pendingCount = pendingCountResult.count ?? 0

  const weekMins = (weekEntries ?? []).reduce((s, e) => s + e.duration_minutes, 0)
  const monthMins = (monthEntries ?? []).reduce((s, e) => s + e.duration_minutes, 0)
  const lastWeekMins = (lastWeekEntries ?? []).reduce((s, e) => s + e.duration_minutes, 0)

  return {
    weekHours: Math.round((weekMins / 60) * 10) / 10,
    lastWeekHours: Math.round((lastWeekMins / 60) * 10) / 10,
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
    projectId: e.project_id,
    description: e.description,
    date: e.date,
    dateLabel: formatEntryDate(e.date),
    startTime: e.start_time ?? '00:00',
    endTime: e.end_time ?? '00:00',
    duration: minsToDisplay(e.duration_minutes),
    status: e.status as 'approved' | 'pending' | 'draft',
  }))
}

// ===== REPORTS =====

interface RawReportEntry {
  id: string
  user_id: string
  project_id: string
  date: string
  description: string | null
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
  projects: {
    name: string
    client: string
    client_id: string | null
    color: string
    budget_hours: number | null
    billable: boolean | null
    status: string
    clients: { name: string } | null
  } | null
  profile?: { full_name: string; initials: string; color: string } | null
}

export async function fetchReportData(startDate: string, endDate: string, includeAllUsers = false) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('time_entries')
    .select(`*, projects (name, client, client_id, color, budget_hours, billable, status, clients(name))`)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (!includeAllUsers) {
    query = query.eq('user_id', user.id)
  } else {
    // Scope to users in the admin's own organisation only
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    const orgId = adminProfile?.organization_id
    if (orgId) {
      const { data: orgMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', orgId)
      const orgUserIds = (orgMembers ?? []).map(m => m.id)
      if (orgUserIds.length > 0) {
        query = query.in('user_id', orgUserIds)
      } else {
        return [] // org has no members yet
      }
    } else {
      // Admin not in an org — fall back to own entries only
      query = query.eq('user_id', user.id)
    }
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // For team view: fetch profiles for all unique user_ids in the result
  const profileMap = new Map<string, { full_name: string; initials: string; color: string }>()
  if (includeAllUsers && data && data.length > 0) {
    const userIds = [...new Set((data as RawReportEntry[]).map(e => e.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, initials, color')
      .in('id', userIds)
    ;(profiles ?? []).forEach(p => profileMap.set(p.id, { full_name: p.full_name, initials: p.initials, color: p.color }))
  }

  return ((data ?? []) as RawReportEntry[]).map(e => ({
    ...e,
    profile: profileMap.get(e.user_id) ?? null,
  }))
}

// ===== APPROVALS =====

export async function fetchApprovals() {
  const { data, error } = await supabase
    .from('approvals')
    .select(`*, profiles!approvals_user_id_fkey (full_name, initials, color, role)`)
    .order('submitted_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return []

  // Batch: fetch all relevant entries in ONE query instead of N queries.
  // Scope to the union of all user_ids and the full date range across all approvals.
  const userIds   = [...new Set(data.map(a => a.user_id))]
  const minDate   = data.reduce((min, a) => a.week_start < min ? a.week_start : min, data[0].week_start)
  const maxDate   = data.reduce((max, a) => a.week_end   > max ? a.week_end   : max, data[0].week_end)

  const { data: allEntries } = await supabase
    .from('time_entries')
    .select(`project_id, user_id, date, duration_minutes, status, projects (name, color)`)
    .in('user_id', userIds)
    .gte('date', minDate)
    .lte('date', maxDate)

  const entries = allEntries ?? []

  return data.map(a => {
    // Match entries that belong to this approval (same user, date range, status)
    const entryList = entries.filter((e: any) =>
      e.user_id === a.user_id &&
      e.date >= a.week_start &&
      e.date <= a.week_end &&
      e.status === a.status
    )

    const projectMap = new Map<string, { name: string; color: string; minutes: number }>()
    entryList.forEach((e: any) => {
      const existing = projectMap.get(e.project_id)
      if (existing) {
        existing.minutes += e.duration_minutes
      } else {
        projectMap.set(e.project_id, {
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
      rejectionReason: a.rejection_reason ?? undefined,
      resubmitted: a.status === 'pending' && a.reviewed_at != null,
    }
  })
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
    .select('id, status')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('approvals')
      .update({ status: 'pending', total_hours: totalHours, submitted_at: new Date().toISOString(), rejection_reason: null })
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
    .in('status', ['draft', 'rejected'])
    .gte('date', weekStart)
    .lte('date', weekEnd)
}

export async function updateApprovalStatus(id: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
  // Uses a SECURITY DEFINER Postgres function so the admin's JWT can update
  // another user's time_entries without being blocked by the SELECT RLS policy.
  // (Without SECURITY DEFINER the UPDATE silently matches 0 rows because the
  // SELECT row-filter prevents the admin from seeing the developer's entries,
  // leaving them permanently stuck on 'pending'.)
  const { error } = await supabase.rpc('update_approval_status', {
    p_approval_id: id,
    p_status:      status,
    p_reason:      reason ?? null,
  })
  if (error) throw new Error(error.message)
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
  billable: boolean
  status: string
  clientId?: string
  clientName?: string
}): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({
      name: updates.name,
      color: updates.color,
      budget_hours: updates.budgetHours,
      billable: updates.billable,
      status: updates.status,
      client_id: updates.clientId ?? null,
      ...(updates.clientName !== undefined ? { client: updates.clientName } : {}),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ===== PROFILE =====

export async function updateProfile(updates: {
  fullName: string
  initials: string
  color: string
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.fullName,
      initials:  updates.initials,
      color:     updates.color,
    })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

// ===== CLIENTS =====

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, org_id')
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map(c => ({ id: c.id, name: c.name, orgId: c.org_id ?? undefined }))
}

export async function createClient(name: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({ name })
    .select('id, name, org_id')
    .single()
  if (error) throw new Error(error.message)
  return { id: data.id, name: data.name, orgId: data.org_id ?? undefined }
}

// ===== ORGANIZATIONS =====

export async function fetchOrganizations(): Promise<Organization[]> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return await Promise.all((orgs ?? []).map(async org => {
    const [{ data: members }, { data: projects }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, initials, color, role')
        .eq('organization_id', org.id)
        .eq('is_active', true),
      supabase
        .from('projects')
        .select('id, name, color, status')
        .eq('organization_id', org.id)
        .is('deleted_at', null),
    ])

    return {
      id:        org.id,
      name:      org.name,
      createdAt: org.created_at,
      members:   (members ?? []).map(m => ({
        id:       m.id,
        name:     m.full_name,
        initials: m.initials,
        color:    m.color,
        role:     m.role,
      })),
      projects: (projects ?? []).map(p => ({
        id:     p.id,
        name:   p.name,
        color:  p.color,
        status: p.status,
      })),
    }
  }))
}

export async function createOrganization(name: string): Promise<Organization> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name, created_by: user?.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return { id: data.id, name: data.name, createdAt: data.created_at, members: [], projects: [] }
}

export async function renameOrganization(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('organizations').update({ name }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteOrganization(id: string): Promise<void> {
  // Detach members and projects before deleting
  await Promise.all([
    supabase.from('profiles').update({ organization_id: null }).eq('organization_id', id),
    supabase.from('projects').update({ organization_id: null }).eq('organization_id', id),
  ])
  const { error } = await supabase.from('organizations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addMemberToOrg(orgId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ organization_id: orgId })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function removeMemberFromOrg(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ organization_id: null })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function addProjectToOrg(orgId: string, projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ organization_id: orgId })
    .eq('id', projectId)
  if (error) throw new Error(error.message)
}

export async function removeProjectFromOrg(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ organization_id: null })
    .eq('id', projectId)
  if (error) throw new Error(error.message)
}

export async function fetchUnassignedMembers(orgId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, initials, color, role, email')
    .eq('is_active', true)
    .or(`organization_id.is.null,organization_id.neq.${orgId}`)
  if (error) throw new Error(error.message)
  return (data ?? []).map(m => ({ id: m.id, name: m.full_name, initials: m.initials, color: m.color, role: m.role, email: m.email }))
}

export async function fetchUnassignedProjects(orgId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, color, status')
    .eq('created_by', user!.id)
    .or(`organization_id.is.null,organization_id.neq.${orgId}`)
    .is('deleted_at', null)
  if (error) throw new Error(error.message)
  return (data ?? []).map(p => ({ id: p.id, name: p.name, color: p.color, status: p.status }))
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