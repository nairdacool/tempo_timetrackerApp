import { useState, useEffect } from 'react'
import type { ReportPeriod, WeekBar, ProjectSummary, MemberSummary, DetailEntry } from '../types'
import { fetchReportData } from '../lib/queries'

export interface ClientSummary {
  name:        string
  hours:       number
  projects:    number
  billableHrs: number
}

interface ReportsData {
  bars:            WeekBar[]
  summaries:       ProjectSummary[]
  memberSummaries: MemberSummary[]
  clientSummaries: ClientSummary[]
  detailEntries:   DetailEntry[]
  periodLabel:     string
}

function getPeriodDates(period: ReportPeriod, customFrom?: string, customTo?: string) {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()

  switch (period) {
    case 'this-month':
      return {
        start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        end:   `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`,
        label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      }
    case 'last-month': {
      const lm = new Date(year, month - 1, 1)
      const lastDay = new Date(year, month, 0).getDate()
      return {
        start: `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}-01`,
        end:   `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}-${lastDay}`,
        label: lm.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      }
    }
    case 'q1':
      return {
        start: `${year}-01-01`,
        end:   `${year}-03-31`,
        label: `Q1 ${year}`,
      }
    case 'custom':
      return {
        start: customFrom ?? `${year}-01-01`,
        end:   customTo   ?? now.toISOString().slice(0, 10),
        label: `${customFrom} → ${customTo}`,
      }
  }
}

// Groups entries into weekly buckets and returns WeekBar[]
function buildWeekBars(entries: any[], start: string, end: string): WeekBar[] {
  const bars: WeekBar[] = []
  const startDate = new Date(start + 'T00:00:00')
  const endDate   = new Date(end   + 'T00:00:00')

  // Build week buckets
  let weekStart = new Date(startDate)
  let weekNum   = 1

  while (weekStart <= endDate) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const weekStartStr = weekStart.toISOString().slice(0, 10)
    const weekEndStr   = weekEnd.toISOString().slice(0, 10)

    const weekMins = entries
      .filter(e => e.date >= weekStartStr && e.date <= weekEndStr)
      .reduce((s: number, e: any) => s + e.duration_minutes, 0)

    // Label: show month + week number for multi-month periods
    const monthName = weekStart.toLocaleDateString('en-US', { month: 'short' })
    bars.push({
      label: `${monthName} W${weekNum}`,
      hours: Math.round((weekMins / 60) * 10) / 10,
    })

    weekStart.setDate(weekStart.getDate() + 7)
    weekNum++
    if (weekNum > 4) weekNum = 1
  }

  return bars
}

// Groups entries by project and returns ProjectSummary[]
function buildProjectSummaries(entries: any[]): ProjectSummary[] {
  const map = new Map<string, ProjectSummary>()

  for (const e of entries) {
    const key  = e.project_id
    const proj = e.projects

    if (!map.has(key)) {
      // Resolve client name: prefer FK join (clients.name), fall back to legacy text column
      const clientName = (proj?.clients as { name: string } | null)?.name ?? proj?.client ?? 'Internal'
      map.set(key, {
        name:        proj?.name        ?? 'Unknown',
        client:      clientName,
        clientId:    proj?.client_id   ?? undefined,
        color:       proj?.color       ?? '#c8602a',
        hours:       0,
        budgetHours: proj?.budget_hours ?? 0,
        billable:    proj?.billable    ?? true,
        status:      proj?.status      ?? 'active',
      })
    }

    const summary = map.get(key)!
    summary.hours = Math.round((summary.hours * 60 + e.duration_minutes) / 60 * 10) / 10
  }

  return Array.from(map.values()).sort((a, b) => b.hours - a.hours)
}

// Groups entries by client and returns ClientSummary[]
function buildClientSummaries(entries: any[]): ClientSummary[] {
  const map = new Map<string, ClientSummary & { projectIds: Set<string> }>()

  for (const e of entries) {
    const proj = e.projects
    const clientName = (proj?.clients as { name: string } | null)?.name ?? proj?.client ?? 'Internal'

    if (!map.has(clientName)) {
      map.set(clientName, { name: clientName, hours: 0, projects: 0, billableHrs: 0, projectIds: new Set() })
    }
    const c = map.get(clientName)!
    c.hours       = Math.round((c.hours * 60 + e.duration_minutes) / 60 * 10) / 10
    c.billableHrs = proj?.billable ? Math.round((c.billableHrs * 60 + e.duration_minutes) / 60 * 10) / 10 : c.billableHrs
    if (e.project_id) c.projectIds.add(e.project_id)
  }

  return Array.from(map.values())
    .map(({ projectIds, ...rest }) => ({ ...rest, projects: projectIds.size }))
    .sort((a, b) => b.hours - a.hours)
}

function buildMemberSummaries(entries: any[]): MemberSummary[] {
  const map = new Map<string, { name: string; initials: string; color: string; hours: number; projects: Set<string> }>()

  for (const e of entries) {
    if (!map.has(e.user_id)) {
      map.set(e.user_id, {
        name:     e.profile?.full_name ?? 'Unknown',
        initials: e.profile?.initials  ?? '?',
        color:    e.profile?.color     ?? '#c8602a',
        hours:    0,
        projects: new Set(),
      })
    }
    const m = map.get(e.user_id)!
    m.hours = Math.round((m.hours * 60 + e.duration_minutes) / 60 * 10) / 10
    if (e.project_id) m.projects.add(e.project_id)
  }

  return Array.from(map.entries())
    .map(([memberId, m]) => ({
      memberId,
      name:         m.name,
      initials:     m.initials,
      color:        m.color,
      hours:        m.hours,
      projectCount: m.projects.size,
    }))
    .sort((a, b) => b.hours - a.hours)
}

function buildDetailEntries(entries: any[]): DetailEntry[] {
  return entries.map(e => ({
    date:        e.date,
    member:      e.profile?.full_name ?? 'Me',
    project:     e.projects?.name     ?? 'Unknown',
    client:      (e.projects?.clients as { name: string } | null)?.name ?? e.projects?.client ?? 'Internal',
    description: e.description        ?? '',
    hours:       Math.round((e.duration_minutes / 60) * 100) / 100,
  }))
}

export function useReports(period: ReportPeriod, customFrom: string, customTo: string, isAdmin = false) {
  const [data,    setData]    = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {

    // Don't fetch if custom period has no valid range
    if (period === 'custom' && (!customFrom || !customTo || customFrom > customTo)) {
      setLoading(false)
      setData(null)
      return
    }

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const { start, end, label } = getPeriodDates(period, customFrom, customTo)
        const entries = await fetchReportData(start, end, isAdmin)

        setData({
          bars:            buildWeekBars(entries, start, end),
          summaries:       buildProjectSummaries(entries),
          memberSummaries: buildMemberSummaries(entries),
          clientSummaries: buildClientSummaries(entries),
          detailEntries:   buildDetailEntries(entries),
          periodLabel:     label,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [period, customFrom, customTo, isAdmin])

  return { data, loading, error }
}