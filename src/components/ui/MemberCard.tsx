import { useState } from 'react'
import type { Member } from '../../types'

const roleColors: Record<string, { bg: string; color: string }> = {
  'Admin':     { bg: 'var(--accent-light)', color: 'var(--accent)' },
  'Developer': { bg: 'var(--blue-light)',   color: 'var(--blue)'   },
  'Designer':  { bg: 'var(--green-light)',  color: 'var(--green)'  },
  'Engineer':  { bg: 'var(--amber-light)',  color: 'var(--amber)'  },
}

interface MemberCardProps {
  member:   Member
  isAdmin?: boolean
  onEdit?:  (member: Member) => void
}

export default function MemberCard({ member, isAdmin, onEdit }: MemberCardProps) {
  const [hovered, setHovered] = useState(false)
  const rc = roleColors[member.role] ?? { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' }
  const isOnline = member.status === 'active'

  return (
    <div
      data-testid={`member-card-${member.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '18px 16px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
        gap: '10px',
        cursor: 'default',
        transition: 'all 0.2s',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative',
        opacity: member.isActive ? 1 : 0.5,
      }}
    >
      {/* Edit button — admin only */}
      {isAdmin && onEdit && hovered && (
        <button
          data-testid="btn-edit-member"
          onClick={() => onEdit(member)}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '6px', padding: '4px 8px',
            fontSize: '11px', fontWeight: 600,
            color: 'var(--text-muted)', cursor: 'pointer',
          }}
        >
          Edit
        </button>
      )}

      {/* Deactivated banner */}
      {!member.isActive && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: '6px', padding: '2px 8px',
          fontSize: '10px', fontWeight: 700,
          color: 'var(--text-muted)', textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}>
          Deactivated
        </div>
      )}

      {/* Avatar with status dot */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: member.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: 700, color: 'white',
        }}>
          {member.initials}
        </div>
        <div style={{
          position: 'absolute', bottom: '2px', right: '2px',
          width: '12px', height: '12px', borderRadius: '50%',
          background: isOnline ? 'var(--green)' : 'var(--border)',
          border: '2px solid var(--bg-card)',
        }} />
      </div>

      {/* Name + role */}
      <div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
          {member.name}
        </div>
        <span style={{
          display: 'inline-block',
          padding: '2px 9px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 600,
          background: rc.bg, color: rc.color,
        }}>
          {member.role}
        </span>
      </div>

      {/* Status label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: isOnline ? 'var(--green)' : 'var(--border)',
        }} />
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {isOnline ? 'Active now' : `Last seen ${member.lastSeen}`}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: '1px', background: 'var(--border)' }} />

      {/* Stats */}
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', width: '100%' }}>
        {[
          { val: `${member.weekHours}h`,  label: 'This week'  },
          { val: `${member.monthHours}h`, label: 'This month' },
          { val: `${member.projects}`,    label: 'Projects'   },
        ].map(stat => (
          <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text)' }}>
              {stat.val}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Email — admin only, always visible */}
      {isAdmin && member.email && (
        <div style={{
          fontSize: '11.5px', color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
          paddingTop: '8px', width: '100%',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {member.email}
        </div>
      )}
    </div>
  )
}