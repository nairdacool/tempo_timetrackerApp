import { useState } from "react";
import type { Project } from "../../types";
import { useBreakpoint } from "../../hooks/useBreakpoint";

interface EntryFormProps {
  projects: Project[];
  onAdd: (entry: {
    projectId: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }) => void;
}

function calcMins(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function formatDuration(mins: number): string {
  if (mins <= 0) return "";
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
}

export default function EntryForm({ projects, onAdd }: EntryFormProps) {
  const [projectId,   setProjectId]   = useState(projects[0]?.id?.toString() ?? "");
  const [description, setDescription] = useState("");
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [startTime,   setStartTime]   = useState("09:00");
  const [endTime,     setEndTime]     = useState("10:00");
  const { isMobile } = useBreakpoint();
  const mins     = calcMins(startTime, endTime);
  const duration = formatDuration(mins);
  const isValid  = description.trim().length > 0 && mins > 0;

  const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: isMobile ? '12px' : '13.5px',
  color: 'var(--text)',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: isMobile ? '8px 6px' : '8px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

  function handleAdd() {
    if (!isValid) return;
    onAdd({ projectId, description, date, startTime, endTime, durationMinutes: mins });
    setDescription("");
    setStartTime("09:00");
    setEndTime("10:00");
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '2px dashed var(--border)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>

      {/* Row 1: Project + Description */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={labelStyle}>Project</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            style={inputStyle}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={labelStyle}>Description</label>
          <input
            type="text"
            placeholder="What did you work on?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Row 2: Date + Start + End + Button */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: isMobile ? '6px' : '12px', 
        alignItems: 'end',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={labelStyle}>Start</label>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={labelStyle}>
            End{duration && (
              <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>{duration}</span>
            )}
          </label>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Button hidden on mobile — full width below */}
        {!isMobile && (
          <button
            onClick={handleAdd}
            disabled={!isValid}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              background: isValid ? 'var(--accent)' : 'var(--bg-subtle)',
              color: isValid ? 'white' : 'var(--text-muted)',
              border: 'none', fontFamily: 'var(--font-body)',
              fontSize: '13px', fontWeight: 600,
              cursor: isValid ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            + Add Entry
          </button>
        )}
      </div>

      {/* Mobile: full width button */}
      {isMobile && (
        <button
          onClick={handleAdd}
          disabled={!isValid}
          style={{
            padding: '12px', borderRadius: '8px',
            background: isValid ? 'var(--accent)' : 'var(--bg-subtle)',
            color: isValid ? 'white' : 'var(--text-muted)',
            border: 'none', fontFamily: 'var(--font-body)',
            fontSize: '14px', fontWeight: 700,
            cursor: isValid ? 'pointer' : 'not-allowed',
            width: '100%',
          }}
        >
          + Add Entry
        </button>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.4px',
};