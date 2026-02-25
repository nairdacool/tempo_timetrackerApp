import { useState } from 'react'
import type { Member } from '../types'
import { mockMembers } from '../data/teamData'
import MemberCard from '../components/ui/MemberCard'
import InviteMemberModal from '../components/ui/InviteMemberModal'

type SortKey = 'name' | 'weekHours' | 'monthHours'

export default function Team() {
  const [members,    setMembers]    = useState<Member[]>(mockMembers)
  const [showModal,  setShowModal]  = useState(false)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [sortBy,     setSortBy]     = useState<SortKey>('name')

  const roles = ['All Roles', 'Admin', 'Developer', 'Designer', 'Engineer']

  const filtered = members
    .filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
      const matchRole   = roleFilter === 'All Roles' || m.role === roleFilter
      return matchSearch && matchRole
    })
    .sort((a, b) => {
      if (sortBy === 'name')       return a.name.localeCompare(b.name)
      if (sortBy === 'weekHours')  return b.weekHours - a.weekHours
      if (sortBy === 'monthHours') return b.monthHours - a.monthHours
      return 0
    })

  function handleInvite(member: Member) {
    setMembers(prev => [...prev, member])
  }

  const activeCount  = members.filter(m => m.status === 'active').length
  const pendingCount = members.filter(m => m.status === 'pending-invite').length

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="Search members…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13.5px', color: 'var(--text)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px', padding: '8px 14px',
            outline: 'none', width: '220px',
          }}
        />

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px', color: 'var(--text)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px', padding: '8px 12px',
            outline: 'none', cursor: 'pointer',
          }}
        >
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px', color: 'var(--text)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px', padding: '8px 12px',
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="name">Sort: Name</option>
          <option value="weekHours">Sort: Week Hours</option>
          <option value="monthHours">Sort: Month Hours</option>
        </select>

        {/* Summary pill */}
        <div style={{
          fontSize: '12px', color: 'var(--text-muted)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px', padding: '8px 14px',
        }}>
          {activeCount} active
          {pendingCount > 0 && <> · <span style={{ color: 'var(--amber)' }}>{pendingCount} pending</span></>}
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            marginLeft: 'auto',
            padding: '8px 18px', borderRadius: '8px',
            background: 'var(--accent)', color: 'white',
            border: 'none', fontFamily: 'var(--font-body)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Invite Member
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)', fontSize: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          No members match your search
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {filtered.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}

          {/* Invite slot */}
          <div
            onClick={() => setShowModal(true)}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: '12px',
              minHeight: '200px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '8px', cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'
              ;(e.currentTarget as HTMLDivElement).style.background = 'var(--accent-light)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
            }}
          >
            <div style={{ fontSize: '28px', color: 'var(--text-placeholder)' }}>+</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Invite Member</div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <InviteMemberModal
          onClose={() => setShowModal(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  )
}