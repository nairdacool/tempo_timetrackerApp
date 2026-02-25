import { useState } from 'react'
import type { Member } from '../../types'

const statusConfig = {
  'active':         { dot: 'var(--green)',  label: 'Active now'     },
  'offline':        { dot: 'var(--border)', label: 'Offline'        },
  'pending-invite': { dot: 'var(--amber)',  label: 'Invite pending' },
}

const roleColors: Record<string, { bg: string; color: string }> = {
  'Admin':     { bg: 'var(--accent-light)', color: 'var(--accent)' },
  'Developer': { bg: 'var(--blue-light)',   color: 'var(--blue)'   },
  'Designer':  { bg: 'var(--green-light)',  color: 'var(--green)'  },
  'Engineer':  { bg: 'var(--amber-light)',  color: 'var(--amber)'  },
}

interface MemberCardProps {
  member: Member
}

export default function MemberCard({ member }: MemberCardProps) {
  const [hovered, setHovered] = useState(false)
  const sc = statusConfig[member.status]
  const rc = roleColors[member.role] ?? { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '22px 20px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
        gap: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative',
      }}
    >
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
        {/* Status dot */}
        <div style={{
          position: 'absolute', bottom: '2px', right: '2px',
          width: '12px', height: '12px', borderRadius: '50%',
          background: sc.dot,
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
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>{sc.label}</span>
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: '1px', background: 'var(--border)' }} />

      {/* Stats */}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', width: '100%' }}>
        {[
          { val: `${member.weekHours}h`, label: 'This week'  },
          { val: `${member.monthHours}h`, label: 'This month' },
          { val: `${member.projectCount}`, label: 'Projects'  },
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

      {/* Email on hover */}
      {hovered && (
        <div style={{
          fontSize: '11.5px', color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
          paddingTop: '8px', width: '100%',
          animation: 'fadeIn 0.15s ease',
        }}>
          {member.email}
        </div>
      )}
    </div>
  )
}