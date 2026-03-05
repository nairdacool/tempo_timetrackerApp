import { useEffect, useState } from 'react'
import type { Approval } from '../../types'
import type { TimeEntry } from '../../types'
import { fetchTimeEntries } from '../../lib/queries'

interface Props {
  approval: Approval
  onClose: () => void
}

const statusColors: Record<string, { bg: string; text: string }> = {
  approved: { bg: 'var(--green-light)', text: 'var(--green)' },
  pending:  { bg: 'var(--amber-light)', text: 'var(--amber)' },
  rejected: { bg: '#fde8e8',            text: '#c03030'       },
  draft:    { bg: 'var(--bg-subtle)',   text: 'var(--text-muted)' },
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function formatDay(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export default function ApprovalDetailModal({ approval, onClose }: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const dates = getDatesInRange(approval.weekStart, approval.weekEnd)
    fetchTimeEntries(dates, approval.userId)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [approval.id])

  // Group entries by date
  const byDay = entries.reduce<Record<string, TimeEntry[]>>((acc, e) => {
    ;(acc[e.date] ??= []).push(e)
    return acc
  }, {})

  const dates = getDatesInRange(approval.weekStart, approval.weekEnd)
  const datesWithEntries = dates.filter(d => byDay[d]?.length)

  const approvalStatusStyle =
    approval.status === 'approved'
      ? { bg: 'var(--green-light)', text: 'var(--green)', label: '✓ Approved' }
      : approval.status === 'rejected'
      ? { bg: '#fde8e8', text: '#c03030', label: '✗ Rejected' }
      : { bg: 'var(--amber-light)', text: 'var(--amber)', label: '⏳ Pending' }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          width: '100%', maxWidth: '640px',
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: approval.userColor, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: 'white',
          }}>
            {approval.userInitials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
              {approval.userName}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '13px', marginLeft: '8px' }}>
                {approval.userRole}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {approval.weekLabel} · {approval.totalHours}h &nbsp;·&nbsp; {approval.entryCount} entries
            </div>
          </div>

          {/* Status badge */}
          <span style={{
            padding: '4px 10px', borderRadius: '20px',
            fontSize: '11.5px', fontWeight: 600, flexShrink: 0,
            background: approvalStatusStyle.bg, color: approvalStatusStyle.text,
          }}>
            {approvalStatusStyle.label}
          </span>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '6px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: '14px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Project summary chips */}
        {approval.projects.length > 0 && (
          <div style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', flexWrap: 'wrap', gap: '6px',
          }}>
            {approval.projects.map(p => (
              <span key={p.name} style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px', borderRadius: '20px',
                fontSize: '11.5px', fontWeight: 600,
                background: p.color + '22', color: p.color,
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color }} />
                {p.name} · {p.hours}h
              </span>
            ))}
          </div>
        )}

        {/* Entry list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '12px', padding: '40px',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading entries…</span>
            </div>
          ) : datesWithEntries.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px',
              color: 'var(--text-muted)', fontSize: '13px',
            }}>
              No entries found for this week.
            </div>
          ) : (
            datesWithEntries.map(date => (
              <div key={date} style={{ marginBottom: '18px' }}>
                {/* Day label */}
                <div style={{
                  fontSize: '11px', fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: '6px',
                }}>
                  {formatDay(date)}
                </div>

                {/* Entries for this day */}
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: '10px', overflow: 'hidden',
                }}>
                  {byDay[date].map((entry, i) => {
                    const sc = statusColors[entry.status] ?? statusColors.draft
                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 14px',
                          borderBottom: i < byDay[date].length - 1
                            ? '1px solid var(--border)' : 'none',
                          background: 'var(--bg-card)',
                        }}
                      >
                        {/* Project colour dot */}
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: entry.projectColor, flexShrink: 0,
                        }} />

                        {/* Project + description */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px', fontWeight: 600,
                            color: 'var(--text)', whiteSpace: 'nowrap',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {entry.project}
                          </div>
                          {entry.description && (
                            <div style={{
                              fontSize: '11.5px', color: 'var(--text-muted)',
                              marginTop: '1px', whiteSpace: 'nowrap',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {entry.description}
                            </div>
                          )}
                        </div>

                        {/* Time range */}
                        <div style={{
                          fontSize: '11.5px', color: 'var(--text-muted)',
                          flexShrink: 0,
                        }}>
                          {entry.startTime} – {entry.endTime}
                        </div>

                        {/* Duration */}
                        <div style={{
                          fontSize: '13px', fontWeight: 700,
                          color: 'var(--text)', flexShrink: 0, minWidth: '36px',
                          textAlign: 'right',
                        }}>
                          {entry.duration}
                        </div>

                        {/* Status pill */}
                        <span style={{
                          padding: '2px 8px', borderRadius: '20px',
                          fontSize: '10.5px', fontWeight: 600, flexShrink: 0,
                          background: sc.bg, color: sc.text,
                        }}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer total */}
        {!loading && entries.length > 0 && (
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px', color: 'var(--text-muted)',
          }}>
            <span>{entries.length} entries</span>
            <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '14px' }}>
              {approval.totalHours}h total
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
