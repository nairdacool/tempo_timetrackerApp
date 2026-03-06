import { useState } from "react";
import { useTeam } from "../hooks/useTeam";
import { useAuth } from "../context/useAuth";
import MemberCard from "../components/ui/MemberCard";
import InviteMemberModal from "../components/ui/InviteMemberModal";
import EditMemberModal from "../components/ui/EditMemberModal";
import type { Member } from "../types";

type SortKey = "name" | "weekHours" | "monthHours";

export default function Team() {
  const [showModal,      setShowModal]      = useState(false);
  const [search,         setSearch]         = useState("");
  const [roleFilter,     setRoleFilter]     = useState("All Roles");
  const [sortBy,         setSortBy]         = useState<SortKey>("name");
  const [hideInactive,   setHideInactive]   = useState(true);
  const { profile }                         = useAuth();
  const isAdmin                             = profile?.role === 'Admin';
  const { members, loading, error, updateMember, refresh } = useTeam();
  const [editingMember,  setEditingMember]  = useState<Member | null>(null);

  const roles = ["All Roles", "Admin", "Developer", "Designer", "Engineer"];

  if (loading)
    return (
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "center", padding: "80px",
        flexDirection: "column", gap: "16px",
      }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.8s linear infinite",
        }} />
        <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading team…</div>
      </div>
    );

  if (error)
    return (
      <div style={{
        background: "#fde8e8", color: "#c03030",
        borderRadius: "12px", padding: "20px", fontSize: "13px",
      }}>
        ⚠️ {error}
      </div>
    );

  const inactiveCount = members.filter(m => !m.isActive).length

  const filtered = members
    .filter((m) => {
      const matchSearch   = m.name.toLowerCase().includes(search.toLowerCase());
      const matchRole     = roleFilter === "All Roles" || m.role === roleFilter;
      const matchActive   = hideInactive ? m.isActive : true;
      return matchSearch && matchRole && matchActive;
    })
    .sort((a, b) => {
      if (sortBy === "name")       return a.name.localeCompare(b.name);
      if (sortBy === "weekHours")  return b.weekHours - a.weekHours;
      if (sortBy === "monthHours") return b.monthHours - a.monthHours;
      return 0;
    });

  const activeCount  = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "pending-invite").length;

  return (
    <div data-testid="team-page">
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: "12px", marginBottom: "24px", flexWrap: "wrap",
      }}>
        <input
          data-testid="input-search-members"
          type="text"
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13.5px", color: "var(--text)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px", padding: "8px 14px",
            outline: "none", width: "220px",
          }}
        />

        <select
          data-testid="select-role-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px", color: "var(--text)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px", padding: "8px 12px",
            outline: "none", cursor: "pointer",
          }}
        >
          {roles.map((r) => <option key={r}>{r}</option>)}
        </select>

        <select
          data-testid="select-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px", color: "var(--text)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px", padding: "8px 12px",
            outline: "none", cursor: "pointer",
          }}
        >
          <option value="name">Sort: Name</option>
          <option value="weekHours">Sort: Week Hours</option>
          <option value="monthHours">Sort: Month Hours</option>
        </select>

        {/* Summary pill */}
        <div style={{
          fontSize: "12px", color: "var(--text-muted)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px", padding: "8px 14px",
        }}>
          {activeCount} active
          {pendingCount > 0 && (
            <> · <span style={{ color: "var(--amber)" }}>{pendingCount} pending</span></>
          )}
        </div>

        {/* Hide inactive toggle — only shown if there are inactive members */}
        {inactiveCount > 0 && (
          <button
            onClick={() => setHideInactive(prev => !prev)}
            style={{
              padding: "8px 14px", borderRadius: "8px",
              border: "1px solid var(--border)",
              background: hideInactive ? "var(--bg-card)" : "var(--accent-light)",
              color: hideInactive ? "var(--text-muted)" : "var(--accent)",
              fontFamily: "var(--font-body)",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {hideInactive
              ? `Show inactive (${inactiveCount})`
              : `Hide inactive (${inactiveCount})`}
          </button>
        )}

        {isAdmin && (
          <button
            data-testid="btn-invite-member"
            onClick={() => setShowModal(true)}
            style={{
              marginLeft: "auto",
              padding: "8px 18px", borderRadius: "8px",
              background: "var(--accent)", color: "white",
              border: "none", fontFamily: "var(--font-body)",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
          >
            + Invite Member
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-display)", fontSize: "20px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
        }}>
          No members match your search
        </div>
      ) : (
        <div
          data-testid="member-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "14px",
          }}>
          {filtered.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isAdmin={isAdmin}
              onEdit={isAdmin ? setEditingMember : undefined}
            />
          ))}

          {/* Invite slot — admin only */}
          {isAdmin && <div
            onClick={() => setShowModal(true)}
            style={{
              border: "2px dashed var(--border)",
              borderRadius: "12px",
              minHeight: "200px",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "8px", cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLDivElement).style.background  = "var(--accent-light)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLDivElement).style.background  = "transparent";
            }}
          >
            <div style={{ fontSize: "28px", color: "var(--text-placeholder)" }}>+</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Invite Member</div>
          </div>}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <InviteMemberModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refresh() }}
        />
      )}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onSave={updateMember}
          onClose={() => setEditingMember(null)}
        />
      )}
    </div>
  );
}