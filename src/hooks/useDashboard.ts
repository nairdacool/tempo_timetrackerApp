import { useState, useEffect } from 'react'
import { fetchDashboardStats, fetchRecentEntries } from '../lib/queries'

interface DayBar {
  label: string
  hours: number
}

interface RecentEntry {
  id: string
  project: string
  projectColor: string
  description: string
  date: string
  duration: string
  status: 'approved' | 'pending' | 'draft'
}

interface DashboardData {
  weekHours: number
  monthHours: number
  projectCount: number
  pendingCount: number
  weekBars: DayBar[]
  recentEntries: RecentEntry[]
}

export function useDashboard(refreshKey = 0) {
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)

      const [stats, recent] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentEntries(),
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
        weekHours:    stats.weekHours,
        monthHours:   stats.monthHours,
        projectCount: stats.projectCount,
        pendingCount: stats.pendingCount,
        weekBars,
        recentEntries: recent,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  return { data, loading, error }
}