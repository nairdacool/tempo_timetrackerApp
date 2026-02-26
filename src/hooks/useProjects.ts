import { useState, useEffect } from 'react'
import type { Project } from '../types'
import { fetchProjects, createProject } from '../lib/queries'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  async function loadProjects() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchProjects()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  // Load on mount
  useEffect(() => {
    loadProjects()
  }, [])

  async function addProject(project: Omit<Project, 'id' | 'team' | 'loggedHours'>) {
    try {
      await createProject(project)
      await loadProjects() // refresh list from database
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    }
  }

  return { projects, loading, error, addProject, refresh: loadProjects }
}