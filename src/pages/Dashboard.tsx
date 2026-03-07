import { useDashboard } from '../hooks/useDashboard'
import StatCard from '../components/ui/StatCard'
import TimerWidget from '../components/ui/TimerWidget'
import { useState } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import TimeEntryModal from '../components/ui/TimeEntryModal'
import { updateTimeEntry, deleteTimeEntry } from '../lib/queries'
import type { TimeEntry } from '../types'
import { useAuth } from '../context/useAuth'

interface DashboardProps {
  onNavigate: (path: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useDashboard(refreshKey, isAdmin)
  const { isMobile } = useBreakpoint()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'Admin'
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

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
      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading dashboard…</div>
    </div>
  )

  if (error) return (
    <div style={{
      background: '#fde8e8', color: '#c03030',
      border: '1px solid #f5c0c0',
      borderRadius: '12px', padding: '20px', fontSize: '13px',
    }}>
      ⚠️ {error}
    </div>
  )

  const d = data!

  const statusStyles = {
    approved: { bg: 'var(--green-light)', color: 'var(--green)',      label: '✓ Approved' },
    pending:  { bg: 'var(--amber-light)', color: 'var(--amber)',      label: '⏳ Pending'  },
    draft:    { bg: 'var(--bg-subtle)',   color: 'var(--text-muted)', label: '◌ Draft'    },
    rejected: { bg: '#fde8e8',            color: '#c03030',           label: '✗ Rejected' },
  }

  return (
    <div data-testid="dashboard-page">
      {/* Stat Cards — 2x2 on mobile, 4 across on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <StatCard
          label={isAdmin ? 'Team This Week' : 'This Week'}
          value={`${d.weekHours}h`}
          delta={
            d.lastWeekHours === 0 && d.weekHours === 0
              ? 'No entries yet'
              : d.weekHours > d.lastWeekHours
              ? `↑ ${Math.round((d.weekHours - d.lastWeekHours) * 10) / 10}h vs last week`
              : d.weekHours < d.lastWeekHours
              ? `↓ ${Math.round((d.lastWeekHours - d.weekHours) * 10) / 10}h vs last week`
              : '→ Same as last week'
          }
          trend={d.weekHours > d.lastWeekHours ? 'up' : d.weekHours < d.lastWeekHours ? 'down' : 'neutral'}
        />
        <StatCard
          label={isAdmin ? 'Team This Month' : 'This Month'}
          value={`${d.monthHours}h`}
          delta={d.monthHours > 0 ? `↑ ${d.monthHours}h logged` : 'No entries yet'}
          trend={d.monthHours > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          label="Active Projects"
          value={`${d.projectCount}`}
          delta={d.projectCount > 0 ? `${d.projectCount} in progress` : 'No projects yet'}
          trend="neutral"
        />
        <StatCard
          label="Pending Approvals"
          value={`${d.pendingCount}`}
          delta={d.pendingCount > 0 ? '→ Needs action' : '✓ All clear'}
          trend={d.pendingCount > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Timer */}
      <TimerWidget onEntrySaved={() => setRefreshKey(k => k + 1)} />

      {/* Main grid — stacks on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
        gap: '20px',
      }}>
        {/* Recent entries */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                {isAdmin ? 'Recent Team Entries' : 'Recent Time Entries'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isAdmin ? 'Latest logged work across the team' : 'Your latest logged work'}
              </div>
            </div>
            <button
              data-testid="btn-view-all-entries"
              onClick={() => onNavigate('/timesheet')}
              style={{
                marginLeft: 'auto', background: 'transparent',
                border: 'none', color: 'var(--text-muted)',
                fontSize: '13px', fontFamily: 'var(--font-body)',
                cursor: 'pointer', fontWeight: 500,
              }}
            >
              View all →
            </button>
          </div>

          {d.recentEntries.length === 0 ? (
            <div style={{
              padding: '48px', textAlign: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontSize: '18px',
            }}>
              No entries yet —{' '}
              <span
                onClick={() => onNavigate('/timesheet')}
                style={{ color: 'var(--accent)', cursor: 'pointer' }}
              >
                log your first hour
              </span>
            </div>
          ) : isMobile ? (
            // Mobile: card list instead of table
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {d.recentEntries.map(entry => {
                const s = statusStyles[entry.status as keyof typeof statusStyles]
                  ?? { bg: 'var(--bg-subtle)', color: 'var(--text-muted)', label: entry.status }
                const handleEntryClick = () => {
                  if (!isAdmin && entry.status === 'approved') return;
                  setEditingEntry({
                    id: entry.id,
                    project: entry.project,
                    projectColor: entry.projectColor,
                    projectId: entry.projectId,
                    description: entry.description,
                    date: entry.date,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    duration: entry.duration,
                    status: entry.status,
                  })
                }
                return (
                  <div key={entry.id} onClick={handleEntryClick} style={{
                    padding: '12px',
                    background: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: 600,
                        background: entry.projectColor + '22',
                        color: entry.projectColor,
                      }}>
                        <span style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: entry.projectColor, marginRight: '6px',
                        }} />
                        {entry.project}
                      </span>
                      <span style={{
                        fontSize: '11.5px', fontWeight: 600,
                        padding: '3px 9px', borderRadius: '20px',
                        background: s.bg, color: s.color,
                      }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{entry.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{entry.dateLabel}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px' }}>{entry.duration}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Desktop: table
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  {(isAdmin ? ['Member', 'Project', 'Description', 'Date', 'Duration', 'Status'] : ['Project', 'Description', 'Date', 'Duration', 'Status']).map(col => (
                    <th key={col} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                      borderBottom: '1px solid var(--border)',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.recentEntries.map(entry => {
                  const s = statusStyles[entry.status as keyof typeof statusStyles]
                    ?? { bg: 'var(--bg-subtle)', color: 'var(--text-muted)', label: entry.status }
                  const canEdit = isAdmin ? entry.isOwn : entry.status !== 'approved'
                  return (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: canEdit ? 'pointer' : 'default', transition: 'background 0.1s' }}
                      onMouseEnter={e => canEdit && ((e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-subtle)')}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      onClick={() => {
                        if (!canEdit) return
                        setEditingEntry({
                          id: entry.id,
                          project: entry.project,
                          projectColor: entry.projectColor,
                          projectId: entry.projectId,
                          description: entry.description,
                          date: entry.date,
                          startTime: entry.startTime,
                          endTime: entry.endTime,
                          duration: entry.duration,
                          status: entry.status,
                        })
                      }}
                    >
                      {isAdmin && (
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                            <span style={{
                              width: '26px', height: '26px', borderRadius: '50%',
                              background: entry.memberColor ?? 'var(--accent)',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0,
                            }}>
                              {entry.memberInitials ?? '?'}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                              {entry.memberName ?? 'Unknown'}
                            </span>
                          </span>
                        </td>
                      )}
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: 600,
                          background: entry.projectColor + '22',
                          color: entry.projectColor,
                        }}>
                          <span style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: entry.projectColor, marginRight: '6px',
                          }} />
                          {entry.project}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>{entry.description}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>{entry.dateLabel}</td>
                      <td style={{ padding: '13px 16px', fontFamily: 'var(--font-display)', fontSize: '16px' }}>{entry.duration}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '3px 9px', borderRadius: '20px',
                          fontSize: '11.5px', fontWeight: 600,
                          background: s.bg, color: s.color,
                        }}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Week summary */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px', padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
              {isAdmin ? 'Team This Week' : 'This Week'}
            </div>
            {d.weekBars.map(day => {
              const maxHours = 8
              const pct = Math.min((day.hours / maxHours) * 100, 100)
              const barColor = day.hours >= 8 ? 'var(--green)' : day.hours >= 4 ? 'var(--accent)' : day.hours > 0 ? 'var(--amber)' : 'var(--bg-subtle)'
              return (
                <div key={day.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', width: '28px' }}>
                    {day.label}
                  </span>
                  <div style={{ flex: 1, height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      background: barColor, width: `${pct}%`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '36px', textAlign: 'right' }}>
                    {day.hours > 0 ? `${day.hours}h` : '—'}
                  </span>
                </div>
              )
            })}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Total hours</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)' }}>
                {d.weekHours}h
              </span>
            </div>
          </div>

          {/* Quick actions — hide on mobile since bottom nav covers it */}
          {!isMobile && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
                Quick Actions
              </div>
              {[
                { label: 'Log Time',      page: '/timesheet', color: 'var(--accent)', adminOnly: false, icon: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                { label: 'View Projects', page: '/projects',  color: 'var(--blue)',   adminOnly: false, icon: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
                { label: 'Open Reports',  page: '/reports',   color: 'var(--green)',  adminOnly: false, icon: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
                { label: 'Approvals',     page: '/approvals', color: 'var(--amber)',  adminOnly: true,  icon: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              ].filter(a => !a.adminOnly || isAdmin).map(action => (
                <button
                  key={action.label}
                  data-testid={`btn-quick-action-${action.page.replace('/', '')}`}
                  onClick={() => onNavigate(action.page)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    width: '100%',
                    padding: '9px 14px', borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent', color: action.color,
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', textAlign: 'left',
                    marginBottom: '6px', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                >
                  {action.icon}{action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit entry modal */}
      {editingEntry && (
        <TimeEntryModal
          mode="edit"
          projects={d.projects}
          entry={editingEntry}
          onSave={async (data) => {
            await updateTimeEntry(editingEntry.id, data)
            setEditingEntry(null)
            setRefreshKey(k => k + 1)
          }}
          onDelete={async () => {
            await deleteTimeEntry(editingEntry.id)
            setEditingEntry(null)
            setRefreshKey(k => k + 1)
          }}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  )
}