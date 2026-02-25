import { useState } from 'react'
import type { Project } from '../types'
import { mockProjects } from '../data/projectsData'
import ProjectCard from '../components/ui/ProjectCard'
import NewProjectModal from '../components/ui/NewProjectModal'

export default function Projects() {
  const [projects,    setProjects]    = useState<Project[]>(mockProjects)
  const [showModal,   setShowModal]   = useState(false)
  const [search,      setSearch]      = useState('')
  const [clientFilter, setClientFilter] = useState('All Clients')

  const clients = ['All Clients', ...Array.from(new Set(projects.map(p => p.client)))]

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchClient = clientFilter === 'All Clients' || p.client === clientFilter
    return matchSearch && matchClient
  })

  function handleAddProject(project: Project) {
    setProjects(prev => [...prev, project])
  }

  function handleCardClick(project: Project) {
    // Will open a detail view in a future session
    console.log('Clicked project:', project.name)
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '12px', marginBottom: '24px',
      }}>
        <input
          type="text"
          placeholder="Search projects…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13.5px', color: 'var(--text)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 14px',
            outline: 'none',
            width: '260px',
          }}
        />
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px', color: 'var(--text)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 12px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {clients.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Summary pill */}
        <div style={{
          fontSize: '12px', color: 'var(--text-muted)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px', padding: '8px 14px',
        }}>
          {filtered.filter(p => p.status === 'active').length} active
          &nbsp;·&nbsp;
          {filtered.filter(p => p.status === 'on-hold').length} on hold
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
          + New Project
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)', fontSize: '20px',
        }}>
          No projects match your search
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleCardClick}
            />
          ))}

          {/* Add new card */}
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
            <div style={{ fontSize: '13px', fontWeight: 600 }}>New Project</div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddProject}
        />
      )}
    </div>
  )
}