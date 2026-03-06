import { useState } from "react";
import type { Project } from "../../types";

const statusStyles = {
  active: {
    background: "var(--green-light)",
    color: "var(--green)",
    label: "Active",
  },
  "on-hold": {
    background: "var(--amber-light)",
    color: "var(--amber)",
    label: "On Hold",
  },
  completed: { background: "#AECBFA", color: "#1a4fb5", label: "Completed" },
  archived: { background: "#D0D3DA", color: "#6b6b80", label: "Archived" },
};

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  readOnly?: boolean;
}

export default function ProjectCard({ project, onClick, readOnly }: ProjectCardProps) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.round((project.loggedHours / project.budgetHours) * 100);
  const isOverBudget = pct >= 90;
  const s = statusStyles[project.status] ?? {
    background: "#f0f0f0",
    color: "#888888",
    label: project.status,
  };

  return (
    <div
      data-testid={`project-card-${project.id}`}
      onClick={() => !readOnly && onClick(project)}
      onMouseEnter={() => !readOnly && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: readOnly ? "default" : "pointer",
        transition: "all 0.2s",
        opacity: project.status === "archived" ? 0.5 : 1,
        boxShadow: hovered
          ? "0 12px 32px rgba(0,0,0,0.15)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        position: "relative",
      }}
    >

      {/* Color header bar */}
      <div style={{ height: "6px", background: project.color }} />

      <div style={{ padding: "14px 16px" }}>
        {/* Name + client */}
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "4px",
          }}
        >
          {project.name}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "12px",
          }}
        >
          {project.client}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              {project.loggedHours}h
            </div>
            <div
              style={{
                fontSize: "10.5px",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginTop: "2px",
              }}
            >
              Logged
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              {project.budgetHours}h
            </div>
            <div
              style={{
                fontSize: "10.5px",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginTop: "2px",
              }}
            >
              Budget
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                lineHeight: 1,
                color: isOverBudget ? "#e05050" : "var(--text)",
              }}
            >
              {pct}%
            </div>
            <div
              style={{
                fontSize: "10.5px",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginTop: "2px",
              }}
            >
              Used
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: "6px",
            background: "var(--bg-subtle)",
            borderRadius: "3px",
            overflow: "hidden",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "3px",
              width: `${Math.min(pct, 100)}%`,
              background: isOverBudget ? "#e05050" : project.color,
              transition: "width 0.6s ease",
            }}
          />
        </div>

        {/* Footer: avatars + status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Team avatars */}
          <div></div>

          {/* Status badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 9px",
              borderRadius: "20px",
              fontSize: "11.5px",
              fontWeight: 600,
              background: s.background,
              color: s.color,
            }}
          >
            {s.label}
          </span>
        </div>
      </div>
    </div>
  );
}
