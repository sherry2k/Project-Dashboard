"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Filter,
  Plus,
  History,
  User,
  LogOut,
  ChevronDown,
  Shield,
  FileText,
  PlusCircle,
  Edit3,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: string;
}

interface Notification {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  details: string | null;
  userName: string;
  createdAt: string;
}

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onShowFilters: () => void;
  onShowAudit: () => void;
  onAddProject: () => void;
  user?: UserSession | null;
  onLogout?: () => void;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function getActionIcon(action: string) {
  switch (action) {
    case "created":
      return <PlusCircle size={16} className="text-emerald-500" />;
    case "updated":
      return <Edit3 size={16} className="text-blue-500" />;
    case "deleted":
      return <X size={16} className="text-red-500" />;
    case "completed":
      return <CheckCircle2 size={16} className="text-violet-500" />;
    default:
      return <FileText size={16} className="text-slate-400" />;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "created":
      return "bg-emerald-50 border-emerald-100";
    case "updated":
      return "bg-blue-50 border-blue-100";
    case "deleted":
      return "bg-red-50 border-red-100";
    case "completed":
      return "bg-violet-50 border-violet-100";
    default:
      return "bg-slate-50 border-slate-100";
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case "created":
      return "Created";
    case "updated":
      return "Updated";
    case "deleted":
      return "Deleted";
    case "completed":
      return "Completed";
    default:
      return action;
  }
}

export default function Header({
  search,
  onSearchChange,
  onShowFilters,
  onShowAudit,
  onAddProject,
  user,
  onLogout,
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  return (
    <header className="bg-[#5E9E3A] text-white sticky top-0 z-50 shadow-xl no-print backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Company */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shadow-md">
              <span className="text-lg font-bold">U</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold leading-tight tracking-wide">
                Universal Building
              </h1>
              <p className="text-xs text-green-100 leading-tight">
                Engineering Consultants
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-green-200"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search projects, owners, contractors..."
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAddProject}
              className="bg-white hover:bg-gray-100 text-[#5E9E3A] font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={16} />
              <span className="hidden md:inline">Add Project</span>
            </button>

            <button
              onClick={onShowFilters}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Filters"
            >
              <Filter size={18} />
            </button>

            <button
              onClick={onShowAudit}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Audit Log"
            >
              <History size={18} />
            </button>

            {/* Notifications Bell - Now Functional */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleBellClick}
                className={`p-2 rounded-lg hover:bg-white/10 transition-colors relative ${
                  showNotifications ? "bg-white/15" : ""
                }`}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg border-2 border-[#5E9E3A] animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-[#5E9E3A] to-[#4a8a2e] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={16} />
                      <h3 className="text-sm font-semibold">
                        Recent Activity
                      </h3>
                    </div>
                    <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">
                      {notifications.length} updates
                    </span>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {loading && notifications.length === 0 ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 border-2 border-[#5E9E3A] border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-sm text-slate-500">
                          Loading...
                        </span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <Bell size={32} className="mb-2 opacity-30" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div
                                className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${getActionColor(
                                  notif.action
                                )}`}
                              >
                                {getActionIcon(notif.action)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    {getActionLabel(notif.action)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {notif.entityType}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">
                                  {notif.entityName || "Unknown"}
                                </p>
                                {notif.details && (
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                    {notif.details}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Clock size={10} className="text-slate-400" />
                                  <span className="text-[11px] text-slate-400">
                                    {getTimeAgo(notif.createdAt)}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    •
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {notif.userName}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          onShowAudit();
                        }}
                        className="w-full text-center text-sm text-[#5E9E3A] hover:text-[#4a8a2e] font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <History size={14} />
                        View Full Audit Log
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-2 py-1.5 transition-all"
              >
                <div className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center">
                  <User size={14} />
                </div>
                {user && (
                  <span className="text-sm font-medium hidden md:block max-w-[100px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  {user && (
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        @{user.username}
                      </p>
                      <span className="inline-block mt-1 text-xs bg-[#5E9E3A]/10 text-[#5E9E3A] px-2 py-0.5 rounded-full capitalize">
                        {user.role}
                      </span>
                    </div>
                  )}
                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <Shield size={16} />
                      User Management
                    </Link>
                  )}
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
