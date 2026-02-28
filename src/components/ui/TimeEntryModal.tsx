import { useState, useEffect } from "react";
import type { Project, TimeEntry } from "../../types";
import toast from "react-hot-toast";

interface TimeEntryModalProps {
  mode: "create" | "edit";
  projects: Project[];
  initialProjectId?: string;
  // For create (from timer)
  initialStartTime?: string;
  initialEndTime?: string;
  initialNote?: string;
  // For edit
  entry?: TimeEntry;
  onSave: (data: {
    projectId: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

function calcMins(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

function formatDuration(mins: number): string {
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${h}h`;
}

export default function TimeEntryModal({
  mode,
  projects,
  initialProjectId,
  initialStartTime,
  initialEndTime,
  initialNote,
  entry,
  onSave,
  onDelete,
  onClose,
}: TimeEntryModalProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [projectId, setProjectId] = useState(
    entry?.projectId ?? initialProjectId ?? projects[0]?.id?.toString() ?? "",
  );
  const [description, setDescription] = useState(
    entry?.description ?? initialNote ?? "",
  );
  const [date, setDate] = useState(entry?.date ?? today);
  const [startTime, setStartTime] = useState(
    entry?.startTime ?? initialStartTime ?? "09:00",
  );
  const [endTime, setEndTime] = useState(
    entry?.endTime ?? initialEndTime ?? "10:00",
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mins = calcMins(startTime, endTime);
  const duration = formatDuration(mins);
  const isValid = description.trim().length > 0 && mins > 0;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function handleSave() {
    if (!isValid) return;
    try {
      setSaving(true);
      setError(null);
      await onSave({
        projectId,
        description,
        date,
        startTime,
        endTime,
        durationMinutes: mins,
      });
      toast.success(mode === "create" ? "Time entry saved!" : "Entry updated!");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      setSaving(true);
      await onDelete();
      toast.success("Entry deleted");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "28px",
          width: "480px",
          maxWidth: "95vw",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                color: "var(--text)",
              }}
            >
              {mode === "create" ? "Save Time Entry" : "Edit Time Entry"}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              {mode === "create"
                ? "Review and confirm your logged time"
                : "Update the details below"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#fde8e8",
              color: "#c03030",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Project */}
          <div>
            <label style={labelStyle}>Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={inputStyle}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <input
              type="text"
              placeholder="What did you work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              style={inputStyle}
            />
          </div>

          {/* Date + Times */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Duration preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-subtle)",
              borderRadius: "10px",
              padding: "12px 16px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              Duration
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                color: mins > 0 ? "var(--accent)" : "var(--text-placeholder)",
              }}
            >
              {duration}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          {/* Delete button (edit mode only) */}
          {mode === "edit" &&
            onDelete &&
            (confirmDelete ? (
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: "#c03030",
                  color: "white",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Confirm delete
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "#c03030",
                  border: "1px solid #f5c0c0",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            ))}

          <div style={{ flex: 1 }} />

          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "transparent",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              background:
                isValid && !saving ? "var(--accent)" : "var(--bg-subtle)",
              color: isValid && !saving ? "white" : "var(--text-muted)",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isValid && !saving ? "pointer" : "not-allowed",
            }}
          >
            {saving
              ? "Saving…"
              : mode === "create"
                ? "Save Entry"
                : "Update Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "var(--font-body)",
  fontSize: "13.5px",
  color: "var(--text)",
  background: "var(--bg-subtle)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "9px 12px",
  outline: "none",
  boxSizing: "border-box",
};
