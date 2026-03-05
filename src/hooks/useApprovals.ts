import { useState, useEffect } from 'react'
import type { Approval, ApprovalStatus } from '../types'
import { fetchApprovals, updateApprovalStatus } from '../lib/queries'
import toast from 'react-hot-toast'

export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    load()
  }, [])

  async function changeStatus(id: string, status: 'approved' | 'rejected', reason?: string) {
    // Optimistic update
    setApprovals(prev =>
      prev.map(a => a.id === id ? { ...a, status: status as ApprovalStatus, rejectionReason: status === 'rejected' ? reason : undefined } : a)
    )
    try {
      await updateApprovalStatus(id, status, reason)
      toast.success(status === 'approved' ? '✓ Timesheet approved' : 'Timesheet rejected')
    } catch (err) {
      toast.error('Failed to update approval')
      setError(err instanceof Error ? err.message : 'Failed to update approval')
      await load()
    }
  }

  async function approveAll() {
    const pending = approvals.filter(a => a.status === 'pending')
    setApprovals(prev =>
      prev.map(a => a.status === 'pending' ? { ...a, status: 'approved' as ApprovalStatus } : a)
    )
    try {
      await Promise.all(pending.map(a => updateApprovalStatus(a.id, 'approved')))
      toast.success(`✓ ${pending.length} timesheets approved`)
    } catch {
      toast.error('Failed to approve all')
      await load()
    }
  }

  return { approvals, loading, error, changeStatus, approveAll }
}