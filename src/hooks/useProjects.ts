import { useState, useEffect } from 'react'
import type { Project } from '../types'
import { fetchProjects, createProject, updateProject, deleteProject } from '../lib/queries'
import toast from 'react-hot-toast'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  async function loadProjects() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchProjects()    // ← all projects for the Projects page
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  async function addProject(project: Omit<Project, 'id' | 'team' | 'loggedHours'>) {
    try {
      await createProject(project)
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    }
  }

  async function editProject(
    id: string,
    updates: { name: string; color: string; budgetHours: number; status: string }
  ) {
    try {
      await updateProject(id, updates)
      await loadProjects()
      toast.success('Project updated!')
    } catch {
      toast.error('Failed to update project')
    }
  }

  async function removeProject(id: string) {
    try {
      await deleteProject(id)
      await loadProjects()
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    }
  }

  return { projects, loading, error, addProject, refresh: loadProjects, editProject, removeProject }
}