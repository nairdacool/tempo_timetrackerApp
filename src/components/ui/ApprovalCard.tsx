import { useState } from 'react'
import type { Approval, ApprovalStatus } from '../../types'

interface ApprovalCardProps {
  approval: Approval
  onStatusChange: (id: string, status: ApprovalStatus) => void
}

const statusStyles: Record<ApprovalStatus, { border: string; badge: string; badgeText: string; label: string }> = {
  pending:  { border: 'var(--amber)',  badge: 'var(--amber-light)',  badgeText: 'var(--amber)',      label: '⏳ Pending'  },
  approved: { border: 'var(--green)',  badge: 'var(--green-light)',  badgeText: 'var(--green)',      label: '✓ Approved' },
  rejected: { border: '#e05050',       badge: '#fde8e8',             badgeText: '#c03030',           label: '✗ Rejected' },
}

export default function ApprovalCard({ approval, onStatusChange }: ApprovalCardProps) {
  const [confirming, setConfirming] = useState<'approve' | 'reject' | null>(null)
  const s = statusStyles[approval.status]
  const isDone = approval.status !== 'pending'

  function handleAction(action: 'approve' | 'reject') {
    if (confirming === action) {
      onStatusChange(approval.id, action === 'approve' ? 'approved' : 'rejected')
      setConfirming(null)
    } else {
      setConfirming(action)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderLeft: `4px solid ${s.border}`,
      borderRadius: '12px',
      padding: '18px 20px',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      opacity: isDone ? 0.7 : 1,
      transition: 'opacity 0.3s, box-shadow 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}
      onMouseEnter={e => {
        if (!isDone) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
      }}
    >
      {/* User avatar + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: approval.userColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: 'white',
          flexShrink: 0,
        }}>
          {approval.userInitials}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{approval.userName}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{approval.userRole}</div>
        </div>
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>
          Timesheet — {approval.weekLabel} · {approval.totalHours}h
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {approval.projects.join(' · ')} &nbsp;·&nbsp; {approval.entryCount} entries &nbsp;·&nbsp; Submitted {approval.submittedDate}
        </div>
      </div>

      {/* Status badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '4px 10px', borderRadius: '20px',
        fontSize: '11.5px', fontWeight: 600,
        background: s.badge, color: s.badgeText,
        flexShrink: 0,
      }}>
        {s.label}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {approval.status === 'pending' ? (
          <>
            <button
              onClick={() => handleAction('approve')}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                border: '1px solid transparent',
                fontFamily: 'var(--font-body)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                background: confirming === 'approve' ? 'var(--green)' : 'var(--green-light)',
                color:      confirming === 'approve' ? 'white'        : 'var(--green)',
              }}
            >
              {confirming === 'approve' ? 'Confirm ✓' : '✓ Approve'}
            </button>
            <button
              onClick={() => handleAction('reject')}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                border: '1px solid transparent',
                fontFamily: 'var(--font-body)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                background: confirming === 'reject' ? '#e05050' : '#fde8e8',
                color:      confirming === 'reject' ? 'white'   : '#c03030',
              }}
            >
              {confirming === 'reject' ? 'Confirm ✗' : '✗ Reject'}
            </button>
            {confirming && (
              <button
                onClick={() => setConfirming(null)}
                style={{
                  padding: '7px 10px', borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          <button style={{
            padding: '7px 14px', borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
            View
          </button>
        )}
      </div>
    </div>
  )
}