"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import ProjectTable from "@/components/ProjectTable";
import AddProjectModal from "@/components/AddProjectModal";
import FilterSidebar from "@/components/FilterSidebar";
import AuditPanel from "@/components/AuditPanel";
import type {
  Project,
  ProjectStats,
  AuditLog,
  NotificationItem,
  StatFilter,
  StatFilterType,
} from "@/lib/types";
import { Loader2 } from "lucide-react";

interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
}

const EMPTY_STATS: ProjectStats = {
  total: 0, active: 0, permitIssued: 0, waitingOwner: 0,
  waitingSoilReport: 0, waitingTender: 0, waitingPayment: 0,
  projectCancelled: 0, completed: 0, inProgress: 0,
};


const NOTIF_POLL_MS = 15000;
const NOTIF_SEEN_KEY = "ubec:notifications:lastSeen";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>(EMPTY_STATS);
  const needsInfoCount = projects.filter(
  (p) => !p.contractor?.trim() || !p.remarks?.trim()
).length;
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  // Stat-card selection is tracked separately from the sidebar filters so that
  // clicking a card always shows the complete list of matching projects.
  const [statFilter, setStatFilter] = useState<StatFilter>({ type: "none", value: "" });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // ---- Notifications -------------------------------------------------------
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenRef = useRef<string | null>(null);

  // Get user info (middleware already ensures auth)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    // Stat card selection wins over the sidebar status/noc filters
    if (statFilter.type === "status") {
      params.set("status", statFilter.value);
    } else if (statFilter.type === "noc") {
      params.set("noc", statFilter.value);
    } else if (statFilter.type === "active") {
      params.set("activeOnly", "true");
    }

    if (statFilter.type !== "status" && filters.status) params.set("status", filters.status);
    if (statFilter.type !== "noc" && filters.noc) params.set("noc", filters.noc);
    if (filters.location) params.set("location", filters.location);
    if (filters.architecture) params.set("architecture", filters.architecture);
    if (filters.structure) params.set("structure", filters.structure);

    try {
      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();
      setProjects(data.projects || []);
      setStats(data.stats || EMPTY_STATS);
    } catch {
      setProjects([]);
    }
    setLoading(false);
  }, [search, filters, statFilter]);

  const fetchAuditLogs = useCallback(async () => {
    const res = await fetch("/api/audit?limit=100");
    const data = await res.json();
    setAuditLogs(data);
  }, []);

  /**
   * Pull the latest modifications from any user. Anything newer than the
   * locally stored "last seen" timestamp counts as unread and highlights
   * the bell icon.
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=30", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const items: NotificationItem[] = data.notifications || [];
      setNotifications(items);

      const lastSeen = lastSeenRef.current;
      if (!lastSeen) {
        // First ever visit: treat existing history as already seen
        const initial = items[0]?.createdAt || data.serverTime || new Date().toISOString();
        lastSeenRef.current = initial;
        localStorage.setItem(NOTIF_SEEN_KEY, initial);
        setUnreadCount(0);
        return;
      }

      const seenTime = new Date(lastSeen).getTime();
      setUnreadCount(
        items.filter((n) => new Date(n.createdAt).getTime() > seenTime).length
      );
    } catch {
      // network hiccup — keep previous state
    }
  }, []);

  const markNotificationsRead = useCallback(() => {
    const newest = notifications[0]?.createdAt || new Date().toISOString();
    lastSeenRef.current = newest;
    localStorage.setItem(NOTIF_SEEN_KEY, newest);
    setUnreadCount(0);
  }, [notifications]);

  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    if (authChecked) {
      fetch("/api/setup")
        .then(() => setDbReady(true))
        .catch(() => setDbReady(true));
    }
  }, [authChecked]);

  useEffect(() => {
    if (dbReady) fetchProjects();
  }, [dbReady, fetchProjects]);

  useEffect(() => {
    if (showAudit) fetchAuditLogs();
  }, [showAudit, fetchAuditLogs]);

  // Load persisted "last seen" marker, then poll for new changes made by anyone
  useEffect(() => {
    if (!dbReady) return;
    lastSeenRef.current = localStorage.getItem(NOTIF_SEEN_KEY);

    // Kick off outside the effect body so state updates never cascade renders
    const initial = setTimeout(fetchNotifications, 0);
    const timer = setInterval(fetchNotifications, NOTIF_POLL_MS);
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);

    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [dbReady, fetchNotifications]);

  const handleAddProject = async (data: Record<string, string>) => {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, editedBy: user?.username || "unknown" }),
    });
    setShowAddModal(false);
    fetchProjects();
    fetchNotifications();
  };

  const handleUpdateProject = async (id: number, data: Record<string, unknown>) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, editedBy: user?.username || "unknown" }),
    });
    fetchProjects();
    fetchNotifications();
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

  /**
   * Stat-card click. Every card produces the FULL list of projects that belong
   * to it — conflicting sidebar status/NOC selections are cleared so nothing
   * is hidden from the user.
   */
  const handleStatFilter = (type: StatFilterType, value: string) => {
  setStatFilter({ type, value });
  setFilters((prev) => {
    const next = { ...prev };
    if (type === "none") {
      delete next.status;
      delete next.noc;
    } else if (type === "status") {
      delete next.status;
      delete next.noc;
    } else if (type === "noc") {
      delete next.status;
      delete next.noc;
    } else if (type === "active") {
      delete next.status;
    } else if (type === "dataQuality") {
      delete next.status;
      delete next.noc;
    }
    return next;
  });
};

  // Sidebar filter changes take over from the stat card selection
  const handleSidebarFilterChange = (next: Record<string, string>) => {
    setFilters(next);
    if (next.status || next.noc) {
      setStatFilter({ type: "none", value: "" });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#5E9E3A] mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Header
        search={search}
        onSearchChange={setSearch}
        onShowFilters={() => setShowFilters(!showFilters)}
        onShowAudit={() => setShowAudit(!showAudit)}
        onAddProject={() => { setEditingProject(null); setShowAddModal(true); }}
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkNotificationsRead={markNotificationsRead}
      />

      <main className="px-4 md:px-6 pt-4 pb-8 max-w-[1920px] mx-auto">
        <StatsCards
          stats={stats}
          onFilter={handleStatFilter}
          activeType={statFilter.type}
          activeValue={statFilter.value}
          needsInfoCount={needsInfoCount}
        />

        <div className="flex gap-4 mt-6">
          {showFilters && (
            <FilterSidebar
              filters={filters}
              onFilterChange={handleSidebarFilterChange}
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
              dataQualityFilter={statFilter.type === "dataQuality"}
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
  );
}
