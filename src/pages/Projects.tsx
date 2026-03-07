import { useState } from "react";
import type { Project } from "../types";
import { useProjects } from "../hooks/useProjects";
import ProjectCard from "../components/ui/ProjectCard";
import NewProjectModal from "../components/ui/NewProjectModal";
import toast from "react-hot-toast";
import EditProjectModal from "../components/ui/EditProjectModal";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useAuth } from "../context/useAuth";

export default function Projects() {
  const { isAdmin } = useAuth();
  const { projects, loading, error, addProject, editProject, removeProject } =
    useProjects();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("All Clients");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showArchived, setShowArchived] = useState(false);
  const activeProjects = projects.filter((p) => p.status !== "archived" && p.status !== "completed");
  const inactiveProjects = projects.filter((p) => p.status === "archived" || p.status === "completed");
  const visibleProjects = showArchived ? projects : activeProjects;
  const { isMobile, isTablet } = useBreakpoint();

  const clients = [
    "All Clients",
    ...Array.from(new Set(projects.map((p) => p.client))),
  ];
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'byClient'>('grid');

  const filtered = visibleProjects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchClient =
      clientFilter === "All Clients" || p.client === clientFilter;
    const matchStatus =
      statusFilter === "All Status" || p.status === statusFilter;
    return matchSearch && matchClient && matchStatus;
  });

  async function handleAddProject(project: Project) {
    try {
      await addProject({
        name: project.name,
        client: project.client,
        clientId: project.clientId,
        color: project.color,
        budgetHours: project.budgetHours,
        billable: project.billable,
        status: project.status,
        organizationId: project.organizationId,
      });
      toast.success(`Project "${project.name}" created!`);
      setShowModal(false);
    } catch {
      toast.error("Failed to create project");
    }
  }

  async function handleEditSave(updates: {
    name: string;
    color: string;
    budgetHours: number;
    billable: boolean;
    status: string;
    clientId?: string;
    clientName?: string;
  }) {
    if (!editingProject) return;
    await editProject(editingProject.id, updates);
    setEditingProject(null);
  }

  async function handleDelete() {
    if (!editingProject) return;
    await removeProject(editingProject.id);
    setEditingProject(null);
  }


  // Loading state
  if (loading)
    return (
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
          Loading projects…
        </div>
      </div>
    );

  // Error state
  if (error)
    return (
      <div
        style={{
          background: "#fde8e8",
          color: "#c03030",
          border: "1px solid #f5c0c0",
          borderRadius: "12px",
          padding: "20px",
          fontSize: "13px",
        }}
      >
        ⚠️ {error}
      </div>
    );

  return (
    <div data-testid="projects-page">
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
        <input
          data-testid="input-search-projects"
          type="text"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13.5px",
            color: "var(--text)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 14px",
            outline: "none",
            width: isMobile ? "100%" : "260px",
          }}
        />
        {inactiveProjects.length > 0 && (
          <button
            onClick={() => {
              if (showArchived) setStatusFilter("All Status")
              setShowArchived((v) => !v)
            }}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              background: showArchived ? "var(--accent-light)" : "transparent",
              color: showArchived ? "var(--accent)" : "var(--text-muted)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            {showArchived
              ? "Hide completed & archived"
              : `Show completed & archived (${inactiveProjects.length})`}
          </button>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--text)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 12px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="All Status">All Status</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          {showArchived && <option value="completed">Completed</option>}
          {showArchived && <option value="archived">Archived</option>}
        </select>

        <select
          data-testid="select-client-filter"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--text)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 12px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {clients.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <div
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 14px",
          }}
        >
          {activeProjects.filter((p) => p.status === "active").length} active
          &nbsp;·&nbsp;
          {activeProjects.filter((p) => p.status === "on-hold").length} on hold
          {inactiveProjects.length > 0 && (
            <>&nbsp;·&nbsp;{inactiveProjects.length} hidden</>
          )}
        </div>

        {isAdmin && (
          <button
            data-testid="btn-new-project"
            onClick={() => setShowModal(true)}
            style={{
              marginLeft: "auto",
              padding: "8px 18px",
              borderRadius: "8px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + New Project
          </button>
        )}

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, marginLeft: isAdmin ? 0 : 'auto' }}>
          {(['grid', 'byClient'] as const).map(mode => (
            <button
              key={mode}
              data-testid={`btn-view-${mode}`}
              onClick={() => setViewMode(mode)}
              title={mode === 'grid' ? 'Grid view' : 'Group by client'}
              style={{
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: viewMode === mode ? 'var(--accent)' : 'transparent',
                color: viewMode === mode ? 'white' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {mode === 'grid' ? '⊞' : '≡'}
              <span>{mode === 'grid' ? 'Grid' : 'By Client'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "64px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            marginBottom: "16px",
          }}
        >
          {projects.length === 0
            ? "No projects yet — create your first one!"
            : "No projects match your search"}
        </div>
      )}

      {/* Grid or By-Client view */}
      {viewMode === 'byClient' ? (
        // Group projects under client name headers
        (() => {
          const groups = Array.from(
            filtered.reduce((map, p) => {
              const key = p.client || 'Internal'
              if (!map.has(key)) map.set(key, [])
              map.get(key)!.push(p)
              return map
            }, new Map<string, Project[]>())
          )
          if (groups.length === 0) return null
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {groups.map(([clientName, clientProjects]) => (
                <div key={clientName}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    marginBottom: 12, paddingBottom: 8,
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    {clientName}
                    <span style={{ fontWeight: 500, color: 'var(--text-placeholder)', fontSize: 11, textTransform: 'none', letterSpacing: 0 }}>
                      {clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''}
                      {' · '}{clientProjects.reduce((s, p) => s + p.loggedHours, 0)}h logged
                    </span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 14,
                  }}>
                    {clientProjects.map(project => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={isAdmin ? setEditingProject : () => {}}
                        readOnly={!isAdmin}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })()
      ) : (
        // Default grid view
      <div
        data-testid="project-grid"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px",
        }}
      >
        {filtered.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={isAdmin ? setEditingProject : () => {}}
            readOnly={!isAdmin}
          />
        ))}

        {/* Add new card — admin only */}
        {isAdmin && <div
          onClick={() => setShowModal(true)}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: "12px",
            minHeight: isMobile ? "80px" : "200px", 
            gridColumn: isMobile ? "1 / -1" : "auto", 
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor =
              "var(--accent)";
            (e.currentTarget as HTMLDivElement).style.background =
              "var(--accent-light)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor =
              "var(--border)";
            (e.currentTarget as HTMLDivElement).style.background =
              "transparent";
          }}
        >
          <div style={{ fontSize: "28px", color: "var(--text-placeholder)" }}>
            +
          </div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>New Project</div>
        </div>}
      </div>
      )} {/* end viewMode ternary */}

      {/* Modal */}
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddProject}
        />
      )}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onSave={handleEditSave}
          onDelete={handleDelete}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
}
