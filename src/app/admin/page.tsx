"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Check,
  X,
  Trash2,
  Shield,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  approved: number;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    // Check if user is admin
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/dashboard");
        } else {
          setCurrentUser(data.user);
          fetchUsers();
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      // Ignore
    }
    setLoading(false);
  };

  const approveUser = async (userId: number) => {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: 1 }),
    });
    fetchUsers();
  };

  const rejectUser = async (userId: number) => {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: 0 }),
    });
    fetchUsers();
  };

  const makeAdmin = async (userId: number) => {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    fetchUsers();
  };

  const makeUser = async (userId: number) => {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user" }),
    });
    fetchUsers();
  };

  const deleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await fetch(`/api/users/${userId}`, { method: "DELETE" });
      fetchUsers();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#5E9E3A]" />
      </div>
    );
  }

  const pendingUsers = users.filter((u) => u.approved === 0);
  const approvedUsers = users.filter((u) => u.approved === 1);

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Header */}
      <header className="bg-[#5E9E3A] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <Shield size={24} />
                <h1 className="text-lg font-bold">User Management</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-semibold text-slate-800">
                Pending Approvals ({pendingUsers.length})
              </h2>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-200">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-amber-800">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-amber-800">Username</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-amber-800">Registered</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-amber-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-amber-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">@{user.username}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {format(new Date(user.createdAt), "dd MMM yyyy HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => approveUser(user.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Check size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Users */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              All Users ({users.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Loader2 size={32} className="animate-spin text-[#5E9E3A] mx-auto" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Username</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Registered</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">@{user.username}</td>
                      <td className="px-4 py-3">
                        {user.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            <ShieldCheck size={12} />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.approved === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            <UserCheck size={12} />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            <UserX size={12} />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {format(new Date(user.createdAt), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.approved === 0 ? (
                            <button
                              onClick={() => approveUser(user.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => rejectUser(user.id)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Revoke Access"
                            >
                              <X size={16} />
                            </button>
                          )}
                          {user.role === "user" ? (
                            <button
                              onClick={() => makeAdmin(user.id)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Make Admin"
                            >
                              <ShieldCheck size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => makeUser(user.id)}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Remove Admin"
                            >
                              <Shield size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

