import { useState } from "react";
import type { ReportPeriod } from "../types";
import { useReports } from "../hooks/useReports";
import PeriodFilter from "../components/ui/PeriodFilter";
import HoursChart from "../components/ui/HoursChart";
import ProjectBreakdownTable from "../components/ui/ProjectBreakdownTable";
import { downloadCsv } from "../lib/exportCsv";
import { downloadPdf } from "../lib/exportPdf";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";
import { useBreakpoint } from "../hooks/useBreakpoint";

export default function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>("this-month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState<'project' | 'member'>('project');

  // Only pass dates to hook when Apply is clicked
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'Admin';
  const { isMobile } = useBreakpoint();

  const { data, loading, error } = useReports(period, appliedFrom, appliedTo, isAdmin);

  const totalHours = data?.summaries.reduce((s, p) => s + p.hours, 0) ?? 0;
  const billableHours =
    data?.summaries
      .filter((p) => p.billable)
      .reduce((s, p) => s + p.hours, 0) ?? 0;
  const billablePct =
    totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;
  const avgPerDay =
    totalHours > 0 ? Math.round((totalHours / 20) * 10) / 10 : 0;

  function handleApply() {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }

  const isCustomReady = period === "custom" && appliedFrom && appliedTo;

  function handleExportCsv() {
    if (!data || data.summaries.length === 0) {
      toast.error("No data to export");
      return;
    }

    const rows = data.summaries.map((p) => ({
      Project: p.name,
      Client: p.client,
      Hours: p.hours,
      "Budget (h)": p.budgetHours,
      "Used %": `${Math.round((p.hours / p.budgetHours) * 100)}%`,
      Status: p.status,
    }));

    downloadCsv(
      `report_${data.periodLabel.replace(/[^a-z0-9]/gi, "_")}.csv`,
      rows,
    );
    toast.success("Report exported!");
  }

  function handleExportPdf() {
    if (!data || data.summaries.length === 0) {
      toast.error("No data to export");
      return;
    }
    downloadPdf({
      periodLabel:     data.periodLabel,
      totalHours,
      billableHours,
      billablePct,
      bars:            data.bars,
      summaries:       data.summaries,
      memberSummaries: data.memberSummaries,
      detailEntries:   data.detailEntries,
    });
    toast.success("PDF exported!");
  }

  function handleExportDetail() {
    if (!data || data.detailEntries.length === 0) {
      toast.error("No entries to export");
      return;
    }
    const rows = data.detailEntries.map((e) => ({
      Date: e.date,
      Member: e.member,
      Project: e.project,
      Description: e.description,
      Hours: e.hours,
    }));
    downloadCsv(
      `detail_${data.periodLabel.replace(/[^a-z0-9]/gi, "_")}.csv`,
      rows,
    );
    toast.success("Detail report exported!");
  }

  return (
    <div data-testid="reports-page">
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <PeriodFilter
          active={period}
          onChange={(p) => {
            setPeriod(p);
            // Reset applied custom dates when switching away
            if (p !== "custom") {
              setAppliedFrom("");
              setAppliedTo("");
            }
          }}
        />

        {period === "custom" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--accent)",
              borderRadius: "8px",
              padding: "4px 12px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              From
            </span>
            <input
              data-testid="input-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={dateInputStyle}
            />
            <span
              style={{ color: "var(--text-placeholder)", fontSize: "14px" }}
            >
              →
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              To
            </span>
            <input
              data-testid="input-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={dateInputStyle}
            />
            <button
              data-testid="btn-apply-date-range"
              onClick={handleApply}
              disabled={!dateFrom || !dateTo || dateFrom > dateTo}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                background:
                  dateFrom && dateTo && dateFrom <= dateTo
                    ? "var(--accent)"
                    : "var(--bg-subtle)",
                color:
                  dateFrom && dateTo && dateFrom <= dateTo
                    ? "white"
                    : "var(--text-muted)",
                border: "none",
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: dateFrom && dateTo ? "pointer" : "not-allowed",
              }}
            >
              Apply
            </button>
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button data-testid="btn-export-pdf" onClick={handleExportPdf} style={exportBtnStyle}>Export PDF</button>
        <button data-testid="btn-export-detail" onClick={handleExportDetail} style={exportBtnStyle}>Export Detail</button>
        <button data-testid="btn-export-csv" onClick={handleExportCsv} style={exportBtnStyle}>Export CSV</button>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            Loading report…
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fde8e8",
            color: "#c03030",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Custom empty state */}
      {!loading && period === "custom" && !isCustomReady && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 40px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            color: "var(--text-muted)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              marginBottom: "10px",
            }}
          >
            Select a date range
          </div>
          <div style={{ fontSize: "13px" }}>
            Choose a From and To date above, then hit Apply to load your report.
          </div>
        </div>
      )}

      {/* Report content */}
      {!loading && !error && data && (period !== "custom" || isCustomReady) && (
        <>
          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {[
              {
                label: "Total Hours",
                value: `${totalHours}h`,
                sub: data.periodLabel,
              },
              {
                label: "Billable Hours",
                value: `${billableHours}h`,
                sub: `${billablePct}% of total`,
              },
              {
                label: "Avg per Day",
                value: `${avgPerDay}h`,
                sub: "Working days",
              },
              {
                label: "Projects",
                value: `${data.summaries.length}`,
                sub: "Tracked this period",
              },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: "8px",
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "30px",
                    color: "var(--text)",
                    lineHeight: 1,
                    marginBottom: "6px",
                  }}
                >
                  {card.value}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {card.sub}
                </div>
              </div>
            ))}
          </div>

          {/* No entries state */}
          {data.summaries.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-display)",
                fontSize: "20px",
              }}
            >
              No time entries found for this period
            </div>
          ) : (
            <>
              {/* Tab bar — admin only */}
              {isAdmin && (
                <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
                  {(['project', 'member'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '8px 18px', fontSize: 13, fontWeight: 600,
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                        borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: -1,
                      }}
                    >
                      {tab === 'project' ? 'By Project' : 'By Member'}
                    </button>
                  ))}
                </div>
              )}

              <HoursChart bars={data.bars} periodLabel={data.periodLabel} />

              {activeTab === 'project' || !isAdmin ? (
                <ProjectBreakdownTable summaries={data.summaries} />
              ) : (
                /* By Member table */
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, overflow: 'hidden',
                }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Hours by Member</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {data.memberSummaries.length} member{data.memberSummaries.length !== 1 ? 's' : ''} · {data.summaries.reduce((s, p) => s + p.hours, 0)}h total
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)' }}>
                        {['Member', 'Projects', 'Hours', 'Share'].map(col => (
                          <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const totalMemberHrs = data.memberSummaries.reduce((s, x) => s + x.hours, 0);
                        return data.memberSummaries.map((m, i) => {
                        const share = totalMemberHrs > 0 ? Math.round((m.hours / totalMemberHrs) * 100) : 0;
                        return (
                          <tr key={m.memberId} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: '50%', background: m.color,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                                }}>{m.initials}</div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{m.projectCount}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.hours}h</td>
                            <td style={{ padding: '12px 16px', minWidth: 140 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ width: `${share}%`, height: '100%', background: m.color, borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>{share}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    })()}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

const exportBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-muted)",
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const dateInputStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  color: "var(--text)",
  background: "transparent",
  border: "none",
  outline: "none",
  cursor: "pointer",
};
