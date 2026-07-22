"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Filter,
  Plus,
  History,
  User,
  LogOut,
  ChevronDown,
  Shield,
} from "lucide-react";

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: string;
}

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onShowFilters: () => void;
  onShowAudit: () => void;
  onAddProject: () => void;
  user?: UserSession | null;
  onLogout?: () => void;
}

export default function Header({
  search,
  onSearchChange,
  darkMode,
  onToggleDarkMode,
  onShowFilters,
  onShowAudit,
  onAddProject,
  user,
  onLogout,
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  return (
    <header className="bg-[#5E9E3A] text-white sticky top-0 z-50 shadow-lg no-print">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Company */}
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="UBEC Logo"
              className="w-10 h-10 rounded-lg object-cover shadow-md"
            />
            <div className="hidden sm:block">
              <h1 className="text-base font-bold leading-tight tracking-wide">Universal Building</h1>
              <p className="text-xs text-green-100 leading-tight">Engineering Consultants</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search projects, owners, contractors..."
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white/15 transition-all"
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

            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative" title="Notifications">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative ml-1">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
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
                <ChevronDown size={14} className={`transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-scaleIn">
                  {user && (
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">@{user.username}</p>
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
