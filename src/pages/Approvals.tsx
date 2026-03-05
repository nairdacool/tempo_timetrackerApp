import { useState } from 'react'
import { useApprovals } from '../hooks/useApprovals'
import ApprovalCard from '../components/ui/ApprovalCard'
import ApprovalDetailModal from '../components/ui/ApprovalDetailModal'
import type { Approval } from '../types'

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all'

export default function Approvals() {
  const { approvals, loading, error, changeStatus, approveAll } = useApprovals()
  const [activeTab, setActiveTab] = useState<FilterTab>('pending')
  const [viewingApproval, setViewingApproval] = useState<Approval | null>(null)

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

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '80px',
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading approvals…</div>
    </div>
  )

  return (
    <div>
      {error && (
        <div style={{
          background: '#fde8e8', color: '#c03030',
          borderRadius: '10px', padding: '12px 16px',
          fontSize: '13px', marginBottom: '16px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '2px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px', padding: '4px',
        marginBottom: '20px', width: 'fit-content',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 16px', borderRadius: '6px',
              border: 'none', fontFamily: 'var(--font-body)',
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

      {/* Bulk action banner */}
      {activeTab === 'pending' && counts.pending > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--accent-light)',
          border: '1px solid var(--accent)',
          borderRadius: '10px', padding: '10px 16px',
          marginBottom: '16px',
          fontSize: '13px', color: 'var(--accent)', fontWeight: 600,
        }}>
          <span>⚡ {counts.pending} timesheets waiting for your review</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={approveAll}
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
          {activeTab === 'pending'
            ? '🎉 All caught up — no pending approvals'
            : 'Nothing here yet'}
        </div>
      ) : (
        filtered.map(approval => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            onStatusChange={(id, status) => changeStatus(id as string, status as 'approved' | 'rejected')}
            onView={setViewingApproval}
          />
        ))
      )}

      {viewingApproval && (
        <ApprovalDetailModal
          approval={viewingApproval}
          onClose={() => setViewingApproval(null)}
        />
      )}
    </div>
  )
}