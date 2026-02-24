import { useState, useEffect, useRef } from 'react'

const projects = [
  'Acme Website Redesign',
  'Backend API v2',
  'Mobile App',
  'Data Pipeline',
]

export default function TimerWidget() {
  // useState: stores a value that, when changed, re-renders the component
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [project, setProject] = useState(projects[0])
  const [description, setDescription] = useState('')

  // useRef: stores a value that does NOT trigger re-renders (perfect for intervals)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // useEffect: runs side effects — here we start/stop the interval when `running` changes
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // Cleanup: runs when component unmounts or before next effect
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  function handleToggle() {
    if (running) {
      setRunning(false)
      setSeconds(0)
      setDescription('')
    } else {
      setRunning(true)
    }
  }

  function formatTime(s: number) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '18px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, var(--accent), var(--amber))',
      }} />

      {/* Timer display */}
      <div>
        <div style={{
          fontSize: '11px', fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
          marginBottom: '6px',
        }}>
          Active Timer
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '42px',
          letterSpacing: '-1px',
          color: running ? 'var(--accent)' : 'var(--text)',
          transition: 'color 0.3s',
          minWidth: '180px',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatTime(seconds)}
        </div>
      </div>

      {/* Project + description */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          fontSize: '11px', fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          Project
        </div>
        <select
          value={project}
          onChange={e => setProject(e.target.value)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px', fontWeight: 600,
            color: 'var(--text)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            outline: 'none',
            width: '100%',
          }}
        >
          {projects.map(p => <option key={p}>{p}</option>)}
        </select>
        <input
          type="text"
          placeholder="What are you working on?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%',
          }}
        />
      </div>

      {/* Start/Stop button */}
      <button
        onClick={handleToggle}
        style={{
          width: '54px', height: '54px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
          background: running ? 'var(--green-light)' : 'var(--accent)',
          color: running ? 'var(--green)' : 'white',
          transition: 'all 0.2s',
          boxShadow: running
            ? '0 0 0 0 rgba(42,122,79,0.3)'
            : '0 4px 12px rgba(200,96,42,0.3)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        }}
      >
        {running ? '■' : '▶'}
      </button>
    </div>
  )
}