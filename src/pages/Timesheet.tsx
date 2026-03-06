import { useState, useEffect, useRef } from "react";
import { useTimeEntries } from "../hooks/useTimeEntries";
import WeekNavigator from "../components/ui/WeekNavigator";
import EntryForm from "../components/ui/EntryForm";
import DayGroup from "../components/ui/DayGroup";
import { submitWeekForApproval } from "../lib/queries";
import type { TimeEntry } from "../types";
import TimeEntryModal from "../components/ui/TimeEntryModal";
import toast from "react-hot-toast";
import { downloadCsv } from "../lib/exportCsv";
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';

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

interface TeamMember { id: string; name: string; initials: string; color: string }

export default function Timesheet() {
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = new Date(todayMonday);
  currentMonday.setDate(todayMonday.getDate() + weekOffset * 7);
  const currentWeek = getWeekDates(currentMonday);
  const { isMobile: _isMobile } = useBreakpoint();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'Admin';
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [viewingUserId, setViewingUserId] = useState<string | undefined>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const viewingMember = viewingUserId
    ? teamMembers.find(m => m.id === viewingUserId)
    : null;
  const isViewingOther = !!viewingUserId;

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('profiles')
      .select('id, full_name, initials, color')
      .neq('id', (profile as { id: string }).id)
      .eq('is_active', true)
      .order('full_name')
      .then(({ data }) => {
        setTeamMembers((data ?? []).map(m => ({
          id: m.id,
          name: m.full_name,
          initials: m.initials,
          color: m.color,
        })));
      });
  }, [isAdmin, profile?.id]);

  const {
    entries,
    projects,
    loading,
    error,
    rejectionReason,
    addEntry,
    editEntry,
    removeEntry,
  } = useTimeEntries({
    weekDates: currentWeek.dates,
    userId: viewingUserId,
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
      const msg = err instanceof Error ? err.message : "Failed to submit";
      toast.error(msg);
      setSubmitError(msg);
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
    <div data-testid="timesheet-page">
      {/* Admin member picker — searchable dropdown */}
      {isAdmin && teamMembers.length > 0 && (
        <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 16, display: 'inline-block', minWidth: 220 }}>
          <button
            onClick={() => { setDropdownOpen(o => !o); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: '1px solid var(--border)', cursor: 'pointer',
              background: 'var(--bg-card)', color: 'var(--text)',
              width: '100%', textAlign: 'left',
            }}
          >
            {isViewingOther && viewingMember ? (
              <>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: viewingMember.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>{viewingMember.initials}</div>
                {viewingMember.name}
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                My Timesheet
              </>
            )}
            <svg style={{ marginLeft: 'auto', opacity: 0.5 }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, minWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search members…"
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 6, fontSize: 13,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {/* My Timesheet option */}
                <div
                  onClick={() => { setViewingUserId(undefined); setDropdownOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                    background: !isViewingOther ? 'rgba(255,255,255,0.05)' : 'transparent',
                    fontWeight: !isViewingOther ? 700 : 400,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = !isViewingOther ? 'rgba(255,255,255,0.05)' : 'transparent')}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  My Timesheet
                </div>
                {teamMembers
                  .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
                  .map(m => (
                    <div
                      key={m.id}
                      onClick={() => { setViewingUserId(m.id); setDropdownOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                        background: viewingUserId === m.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                        fontWeight: viewingUserId === m.id ? 700 : 400,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = viewingUserId === m.id ? 'rgba(255,255,255,0.05)' : 'transparent')}
                    >
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', background: m.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>{m.initials}</div>
                      {m.name}
                    </div>
                  ))}
                {teamMembers.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>No members found</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {isViewingOther && viewingMember && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: viewingMember.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
          }}>{viewingMember.initials}</div>
          Viewing <strong style={{ color: 'var(--text)' }}>{viewingMember.name}</strong>'s timesheet — read-only
        </div>
      )}
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
        canSubmit={!isViewingOther && entries.some(e => e.status === 'draft' || e.status === 'rejected')}
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

      {projects.length > 0 && !isViewingOther && (
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
            onEntryClick={isViewingOther ? undefined : (entry) => {
              if (!isAdmin && entry.status === 'approved') return;
              setEditingEntry(entry);
            }}
            rejectionReason={rejectionReason ?? undefined}
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
          rejectionReason={editingEntry.status === 'rejected' ? (rejectionReason ?? undefined) : undefined}
        />
      )}
    </div>
  );
}
