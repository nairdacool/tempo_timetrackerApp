import { useState } from 'react'
import type { Approval, ApprovalStatus } from '../types'
import ApprovalCard from '../components/ui/ApprovalCard'

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all'

interface ApprovalsProps {
  approvals: Approval[]
  onUpdate: (approvals: Approval[]) => void
}

export default function Approvals({ approvals, onUpdate }: ApprovalsProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('pending')

  const counts = {
    pending:  approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    all:      approvals.length,
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'pending',  label: `Pending (${counts.pending})`   },
    { id: 'approved', label: `Approved (${counts.approved})` },
    { id: 'rejected', label: `Rejected (${counts.rejected})` },
    { id: 'all',      label: `All (${counts.all})`           },
  ]

  const filtered = activeTab === 'all'
    ? approvals
    : approvals.filter(a => a.status === activeTab)

  function handleStatusChange(id: number, status: ApprovalStatus) {
    onUpdate(approvals.map(a => a.id === id ? { ...a, status } : a))
  }

  return (
    <div>
      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '2px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '20px',
        width: 'fit-content',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 16px',
              borderRadius: '6px', border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color:      activeTab === tab.id ? 'white'         : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar — only shown when pending tab is active */}
      {activeTab === 'pending' && counts.pending > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--accent-light)',
          border: '1px solid var(--accent)',
          borderRadius: '10px', padding: '10px 16px',
          marginBottom: '16px',
          fontSize: '13px', color: 'var(--accent)',
          fontWeight: 600,
        }}>
          <span>⚡ {counts.pending} timesheets waiting for your review</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => onUpdate(approvals.map(a => a.status === 'pending' ? { ...a, status: 'approved' } : a))}
            style={{
              padding: '6px 14px', borderRadius: '7px',
              background: 'var(--green)', color: 'white',
              border: 'none', fontFamily: 'var(--font-body)',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            ✓ Approve All
          </button>
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)', fontSize: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          {activeTab === 'pending' ? '🎉 All caught up — no pending approvals' : 'Nothing here yet'}
        </div>
      ) : (
        filtered.map(approval => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            onStatusChange={handleStatusChange}
          />
        ))
      )}
    </div>
  )
}