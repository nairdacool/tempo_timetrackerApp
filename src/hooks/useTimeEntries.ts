import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { TimeEntry } from '../types'
import { fetchTimeEntries, fetchWeekRejectionReason, insertTimeEntry, updateTimeEntry, deleteTimeEntry } from '../lib/queries'
import { fetchActiveProjects } from '../lib/queries'
import type { Project } from '../types'

const POLL_INTERVAL_MS = 8000

interface UseTimeEntriesOptions {
  weekDates: string[]
  userId?: string   // if provided, fetch this user's entries (admin view)
}

export function useTimeEntries({ weekDates, userId }: UseTimeEntriesOptions) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)

  // Track known statuses so polling can detect changes and show toasts
  const knownStatuses = useRef<Map<string, string>>(new Map())
  // Prevent duplicate toasts within the same poll cycle
  const notifiedWeeks = useRef<Set<string>>(new Set())

  const weekStart = weekDates[0]
  const weekEnd   = weekDates[weekDates.length - 1]

  const loadSilent = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      setError(null)
      const [entriesData, projectsData, reason] = await Promise.all([
        fetchTimeEntries(weekDates, userId),
        fetchActiveProjects(),
        fetchWeekRejectionReason(weekStart, weekEnd, userId),
      ])

      // On initial load, seed known statuses — never toast on first fetch
      if (isInitial) {
        entriesData.forEach(e => knownStatuses.current.set(e.id, e.status))
        notifiedWeeks.current.clear()
      } else if (!userId) {
        // Polling pass — detect status changes for the current user's view only (not admin view)
        let weekChanged = false
        let newStatus: string | null = null

        entriesData.forEach(e => {
          const prev = knownStatuses.current.get(e.id)
          knownStatuses.current.set(e.id, e.status)
          if (prev && prev !== e.status && (e.status === 'approved' || e.status === 'rejected')) {
            weekChanged = true
            newStatus = e.status
          }
        })

        if (weekChanged && newStatus && !notifiedWeeks.current.has(`${weekStart}_${newStatus}`)) {
          notifiedWeeks.current.add(`${weekStart}_${newStatus}`)
          const start = new Date(weekStart + 'T00:00:00')
          const end   = new Date(weekEnd   + 'T00:00:00')
          const fmt   = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const label = `${fmt(start)} – ${fmt(end)}`
          if (newStatus === 'approved') {
            toast.success(`✓ Timesheet approved\n${label}`, { duration: 5000, style: { whiteSpace: 'pre-line' } })
          } else {
            toast.error(`✗ Timesheet rejected\n${label}`, { duration: 7000, style: { whiteSpace: 'pre-line' } })
          }
        }
      }

      setEntries(entriesData)
      setProjects(projectsData)
      setRejectionReason(reason)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [weekDates, userId, weekStart, weekEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => {
    knownStatuses.current.clear()
    notifiedWeeks.current.clear()
    loadSilent(true)
  }, [weekDates.join(','), userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling — guarantees UI always reflects latest server state
  useEffect(() => {
    const interval = setInterval(() => { loadSilent(false) }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadSilent])

  async function addEntry(entry: {
    projectId: string
    description: string
    date: string
    startTime: string
    endTime: string
    durationMinutes: number
  }) {
    try {
      await insertTimeEntry(entry)
      await loadSilent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry')
    }
  }

  async function editEntry(
    id: string,
    entry: {
      projectId: string
      description: string
      date: string
      startTime: string
      endTime: string
      durationMinutes: number
    }
  ) {
    try {
      await updateTimeEntry(id, entry)
      await loadSilent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry')
    }
  }

  async function removeEntry(id: string) {
    try {
      await deleteTimeEntry(id)
      await loadSilent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry')
    }
  }

  return { entries, projects, loading, error, rejectionReason, addEntry, editEntry, removeEntry }
}