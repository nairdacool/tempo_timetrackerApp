import { useState } from "react";
import { useTimeEntries } from "../hooks/useTimeEntries";
import WeekNavigator from "../components/ui/WeekNavigator";
import EntryForm from "../components/ui/EntryForm";
import DayGroup from "../components/ui/DayGroup";
import { submitWeekForApproval } from "../lib/queries";
import type { TimeEntry } from "../types";
import TimeEntryModal from "../components/ui/TimeEntryModal";
import toast from "react-hot-toast";
import { downloadCsv } from "../lib/exportCsv";
import { useBreakpoint } from '../hooks/useBreakpoint'

// Generates a week object starting from a Monday date
function getWeekDates(monday: Date) {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const start = dates[0];
  const end = dates[6];
  const fmt = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  const year = new Date(end).getFullYear();
  return { label: `${fmt(start)} – ${fmt(end)}, ${year}`, dates };
}

// Get the Monday of any given date
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // handle Sunday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Start from current week's Monday
const todayMonday = getMonday(new Date());

function formatDayLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function durationToMins(dur: string): number {
  const h = parseInt(dur.match(/(\d+)h/)?.[1] ?? "0");
  const m = parseInt(dur.match(/(\d+)m/)?.[1] ?? "0");
  return h * 60 + m;
}

function minsToLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function Timesheet() {
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = new Date(todayMonday);
  currentMonday.setDate(todayMonday.getDate() + weekOffset * 7);
  const currentWeek = getWeekDates(currentMonday);
  const { isMobile } = useBreakpoint()
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const {
    entries,
    projects,
    loading,
    error,
    addEntry,
    editEntry,
    removeEntry,
  } = useTimeEntries({
    weekDates: currentWeek.dates,
  });

  const grouped = currentWeek.dates
    .slice()
    .reverse()
    .map((date) => ({
      date,
      label: formatDayLabel(date),
      entries: entries.filter((e) => e.date === date),
    }))
    .filter((g) => g.entries.length > 0);

  const totalMins = entries.reduce(
    (sum, e) => sum + durationToMins(e.duration),
    0,
  );
  const totalHours = minsToLabel(totalMins);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await submitWeekForApproval(currentWeek.dates[0], currentWeek.dates[6]);
      setSubmitted(true);
      toast.success("Timesheet submitted for approval!");
    } catch (err) {
      toast.error("Failed to submit timesheet");
      setSubmitError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }
  async function handleEditSave(data: {
    projectId: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }) {
    if (!editingEntry) return;
    await editEntry(editingEntry.id, data);
  }

  async function handleDelete() {
    if (!editingEntry) return;
    await removeEntry(editingEntry.id);
  }

  function handleExportCsv() {
    if (entries.length === 0) {
      toast.error("No entries to export this week");
      return;
    }

    const rows = entries.map((e) => ({
      Date: e.date,
      Project: e.project,
      Description: e.description,
      Start: e.startTime,
      End: e.endTime,
      Duration: e.duration,
      Status: e.status,
    }));

    const weekLabel = currentWeek.label.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(`timesheet_${weekLabel}.csv`, rows);
    toast.success("Timesheet exported!");
  }

  async function handleAddEntry(entry: {
    projectId: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }) {
    try {
      await addEntry(entry);
      toast.success("Time entry added!");
    } catch {
      toast.error("Failed to add entry");
    }
  }

  return (
    <div>
      <WeekNavigator
        weekLabel={currentWeek.label}
        totalHours={totalHours || "0h"}
        onPrev={() => {
          setWeekOffset((o) => o - 1);
          setSubmitted(false);
        }}
        onNext={() => {
          setWeekOffset((o) => o + 1);
          setSubmitted(false);
        }}
        onSubmit={handleSubmit}
        onExport={handleExportCsv}
        submitting={submitting}
      />
      {submitted && (
        <div
          style={{
            background: "var(--green-light)",
            color: "var(--green)",
            border: "1px solid var(--green)",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ✓ Timesheet submitted for approval — entries are now pending review.
        </div>
      )}

      {submitError && (
        <div
          style={{
            background: "#fde8e8",
            color: "#c03030",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          ⚠️ {submitError}
        </div>
      )}
      {error && (
        <div
          style={{
            background: "#fde8e8",
            color: "#c03030",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {projects.length > 0 && (
        <EntryForm projects={projects} onAdd={handleAddEntry} />
      )}

      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            Loading entries…
          </div>
        </div>
      ) : grouped.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
          }}
        >
          No entries this week — add your first one above!
        </div>
      ) : (
        grouped.map((group) => (
          <DayGroup
            key={group.date}
            label={group.label}
            totalHours={minsToLabel(
              group.entries.reduce(
                (sum, e) => sum + durationToMins(e.duration),
                0,
              ),
            )}
            entries={group.entries}
            onEntryClick={setEditingEntry}
          />
        ))
      )}
      {editingEntry && (
        <TimeEntryModal
          mode="edit"
          projects={projects}
          entry={editingEntry}
          onSave={handleEditSave}
          onDelete={handleDelete}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
