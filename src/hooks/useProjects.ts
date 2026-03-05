import { useState, useEffect } from 'react'
import type { Project } from '../types'
import { fetchProjects, createProject, updateProject, deleteProject } from '../lib/queries'
import toast from 'react-hot-toast'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    updates: { name: string; color: string; budgetHours: number; billable: boolean; status: string }
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
      setProjects(prev => prev.filter(p => p.id !== id))
      await deleteProject(id)
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
      await loadProjects()
    }
  }

  return { projects, loading, error, addProject, refresh: loadProjects, editProject, removeProject }
}