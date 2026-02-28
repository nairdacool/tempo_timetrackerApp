import { useState, useEffect, useRef } from 'react'
import type { Project } from '../../types'
import { fetchActiveProjects, insertTimeEntry } from '../../lib/queries'
import TimeEntryModal from './TimeEntryModal'

function pad(n: number) { return String(n).padStart(2, '0') }

function toTimeString(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
  interface TimerWidgetProps {
    onEntrySaved?: () => void
  }
export default function TimerWidget({ onEntrySaved }: TimerWidgetProps) {
  const [projects,   setProjects]   = useState<Project[]>([])
  const [projectId,  setProjectId]  = useState('')
  const [note,       setNote]       = useState('')
  const [running,    setRunning]    = useState(false)
  const [elapsed,    setElapsed]    = useState(0)
  const [startedAt,  setStartedAt]  = useState<Date | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [savedStart, setSavedStart] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchActiveProjects().then(data => {
      setProjects(data)
      if (data.length > 0) setProjectId(data[0].id.toString())
    })
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  function handleStart() {
    const now = new Date()
    setStartedAt(now)
    setSavedStart(toTimeString(now))
    setElapsed(0)
    setRunning(true)
  }

  function handleStop() {
    setRunning(false)
    setShowModal(true)
  }

  async function handleSaveEntry(data: {
    projectId: string
    description: string
    date: string
    startTime: string
    endTime: string
    durationMinutes: number
  }) {
    await insertTimeEntry(data)
    // Reset timer
    setElapsed(0)
    setStartedAt(null)
    setNote('')
    onEntrySaved?.() 
  }

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60

  const endTime = showModal ? toTimeString(new Date()) : ''

  return (
    <>
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${running ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '12px', padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: running ? '0 0 0 3px var(--accent-light)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Timer display */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {running ? '● Recording' : 'Active Timer'}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: running ? 'var(--accent)' : 'var(--text)', letterSpacing: '2px', lineHeight: 1 }}>
              {pad(h)}:{pad(m)}:{pad(s)}
            </div>
          </div>

          {/* Project selector */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Project
            </div>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              disabled={running}
              style={{
                width: '100%', fontFamily: 'var(--font-body)',
                fontSize: '14px', color: 'var(--text)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px',
                outline: 'none',
                opacity: running ? 0.6 : 1,
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Note (optional)
            </div>
            <input
              type="text"
              placeholder="What are you working on?"
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={running}
              style={{
                width: '100%', fontFamily: 'var(--font-body)',
                fontSize: '14px', color: 'var(--text)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px',
                outline: 'none', boxSizing: 'border-box',
                opacity: running ? 0.6 : 1,
              }}
            />
          </div>

          {/* Play/Stop button */}
          <button
            onClick={running ? handleStop : handleStart}
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: running ? '#c03030' : 'var(--accent)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', color: 'white',
              boxShadow: running ? '0 0 0 4px rgba(192,48,48,0.2)' : '0 4px 12px rgba(200,96,42,0.4)',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            {running ? '⏹' : '▶'}
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <TimeEntryModal
          mode="create"
          projects={projects}
          initialProjectId={projectId}  
          initialStartTime={savedStart}
          initialEndTime={endTime}
          initialNote={note}  
          onSave={handleSaveEntry}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}