import { useState, useEffect } from 'react'
import type { TimeEntry } from '../types'
import { fetchTimeEntries, insertTimeEntry } from '../lib/queries'
import { fetchProjects } from '../lib/queries'
import type { Project } from '../types'

interface UseTimeEntriesOptions {
  weekDates: string[]
}

export function useTimeEntries({ weekDates }: UseTimeEntriesOptions) {
  const [entries,  setEntries]  = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [entriesData, projectsData] = await Promise.all([
        fetchTimeEntries(weekDates),
        fetchProjects(),
      ])
      setEntries(entriesData)
      setProjects(projectsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [weekDates.join(',')])

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
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry')
    }
  }

  return { entries, projects, loading, error, addEntry }
}