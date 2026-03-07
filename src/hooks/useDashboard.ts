import { useState, useEffect, useCallback } from 'react'
import { fetchDashboardStats, fetchRecentEntries, fetchActiveProjects } from '../lib/queries'
import type { Project } from '../types'

interface DayBar {
  label: string
  hours: number
}

interface RecentEntry {
  id: string
  project: string
  projectColor: string
  projectId: string
  description: string
  date: string        // 'YYYY-MM-DD'
  dateLabel: string   // formatted display string
  startTime: string
  endTime: string
  duration: string
  status: 'approved' | 'pending' | 'draft'
  memberName:     string | null
  memberInitials: string | null
  memberColor:    string | null
  isOwn: boolean
}

interface DashboardData {
  weekHours: number
  lastWeekHours: number
  monthHours: number
  projectCount: number
  pendingCount: number
  weekBars: DayBar[]
  recentEntries: RecentEntry[]
  projects: Project[]
}

export function useDashboard(refreshKey = 0, isAdmin = false, ready = true) {
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [stats, recent, projects] = await Promise.all([
        fetchDashboardStats(isAdmin),
        fetchRecentEntries(isAdmin),
        fetchActiveProjects(),
      ])

      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const monday = new Date(stats.weekStart + 'T00:00:00')

      const weekBars: DayBar[] = dayLabels.map((label, i) => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + i)
        const dateStr = date.toISOString().slice(0, 10)
        const dayMins = stats.weekEntries
          .filter((e: any) => e.date === dateStr)
          .reduce((s: number, e: any) => s + e.duration_minutes, 0)
        return { label, hours: Math.round((dayMins / 60) * 10) / 10 }
      })

      setData({
        weekHours:     stats.weekHours,
        lastWeekHours: stats.lastWeekHours,
        monthHours:    stats.monthHours,
        projectCount:  stats.projectCount,
        pendingCount:  stats.pendingCount,
        weekBars,
        recentEntries: recent,
        projects,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return
    load()
  }, [load, refreshKey, ready])

  return { data, loading, error }
}