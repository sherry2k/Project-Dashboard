"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import ProjectTable from "@/components/ProjectTable";
import AddProjectModal from "@/components/AddProjectModal";
import FilterSidebar from "@/components/FilterSidebar";
import AuditPanel from "@/components/AuditPanel";
import type { Project, ProjectStats, AuditLog } from "@/lib/types";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0, active: 0, permitIssued: 0, waitingOwner: 0,
    waitingSoilReport: 0, projectCancelled: 0, completed: 0, inProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filters.status) params.set("status", filters.status);
    if (filters.location) params.set("location", filters.location);
    if (filters.noc) params.set("noc", filters.noc);
    if (filters.architecture) params.set("architecture", filters.architecture);
    if (filters.structure) params.set("structure", filters.structure);

    const res = await fetch(`/api/projects?${params.toString()}`);
    const data = await res.json();
    setProjects(data.projects);
    setStats(data.stats);
    setLoading(false);
  }, [search, filters]);

  const fetchAuditLogs = useCallback(async () => {
    const res = await fetch("/api/audit?limit=100");
    const data = await res.json();
    setAuditLogs(data);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (showAudit) fetchAuditLogs();
  }, [showAudit, fetchAuditLogs]);

  const handleAddProject = async (data: Record<string, string>) => {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAddModal(false);
    fetchProjects();
  };

  const handleUpdateProject = async (id: number, data: Record<string, unknown>) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchProjects();
  };

  const handleDeleteProject = async (id: number) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  };

  const handleDuplicateProject = async (id: number) => {
    await fetch(`/api/projects/${id}/duplicate`, { method: "POST" });
    fetchProjects();
  };

  const handleArchiveProject = async (id: number) => {
    await handleUpdateProject(id, { archived: 1 });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowAddModal(true);
  };

  const handleSaveEditProject = async (data: Record<string, string>) => {
    if (editingProject) {
      await handleUpdateProject(editingProject.id, data);
      setEditingProject(null);
    } else {
      await handleAddProject(data);
    }
    setShowAddModal(false);
  };

  const handleStatFilter = (statusValue: string) => {
    if (filters.status === statusValue) {
      setFilters((prev) => {
        const next = { ...prev };
        delete next.status;
        return next;
      });
    } else {
      setFilters((prev) => ({ ...prev, status: statusValue }));
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900 transition-colors">
        <Header
          search={search}
          onSearchChange={setSearch}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onShowFilters={() => setShowFilters(!showFilters)}
          onShowAudit={() => setShowAudit(!showAudit)}
          onAddProject={() => { setEditingProject(null); setShowAddModal(true); }}
        />

        <main className="px-4 md:px-6 pt-4 pb-8 max-w-[1920px] mx-auto">
          <StatsCards stats={stats} onFilter={handleStatFilter} activeFilter={filters.status || ""} />

          <div className="flex gap-4 mt-6">
            {showFilters && (
              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
                onClose={() => setShowFilters(false)}
              />
            )}

            <div className="flex-1 min-w-0">
              <ProjectTable
                projects={projects}
                loading={loading}
                onUpdate={handleUpdateProject}
                onDelete={handleDeleteProject}
                onDuplicate={handleDuplicateProject}
                onArchive={handleArchiveProject}
                onEdit={handleEditProject}
              />
            </div>

            {showAudit && (
              <AuditPanel logs={auditLogs} onClose={() => setShowAudit(false)} />
            )}
          </div>
        </main>

        {showAddModal && (
          <AddProjectModal
            project={editingProject}
            onSave={handleSaveEditProject}
            onClose={() => { setShowAddModal(false); setEditingProject(null); }}
          />
        )}
      </div>
    </div>
  );
}
