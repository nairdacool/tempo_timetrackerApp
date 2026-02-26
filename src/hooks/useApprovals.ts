import { useState, useEffect } from 'react'
import type { Approval, ApprovalStatus } from '../types'
import { fetchApprovals, updateApprovalStatus } from '../lib/queries'

export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchApprovals()
      setApprovals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function changeStatus(id: string, status: 'approved' | 'rejected') {
    // Optimistic update — update UI immediately
    setApprovals(prev =>
      prev.map(a => a.id === id ? { ...a, status: status as ApprovalStatus } : a)
    )
    try {
      await updateApprovalStatus(id, status)
    } catch (err) {
      // Rollback on failure
      setError(err instanceof Error ? err.message : 'Failed to update approval')
      await load()
    }
  }

  async function approveAll() {
    const pending = approvals.filter(a => a.status === 'pending')
    // Optimistic update
    setApprovals(prev =>
      prev.map(a => a.status === 'pending' ? { ...a, status: 'approved' as ApprovalStatus } : a)
    )
    try {
      await Promise.all(pending.map(a => updateApprovalStatus(a.id as string, 'approved')))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve all')
      await load()
    }
  }

  return { approvals, loading, error, changeStatus, approveAll }
}