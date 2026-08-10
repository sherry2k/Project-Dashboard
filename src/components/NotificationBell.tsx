"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, CheckCheck, Inbox } from "lucide-react";
import type { NotificationItem } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

const FIELD_LABELS: Record<string, string> = {
  ownerName: "Owner Name",
  projectNo: "Project No",
  plotNo: "Plot No",
  projectLocation: "Location",
  noc: "NOC",
  perspective3d: "3D Perspective",
  architecture: "Architecture",
  structure: "Structure",
  status: "Status",
  contractor: "Contractor",
  remarks: "Remarks",
  archived: "Archived",
};

interface NotificationBellProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllRead: () => void;
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export default function NotificationBell({
  notifications,
  unreadCount,
  onMarkAllRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasUnread = unreadCount > 0;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-2 rounded-lg transition-colors relative ${
          hasUnread ? "bg-white/20 hover:bg-white/30" : "hover:bg-white/10"
        }`}
        title={hasUnread ? `${unreadCount} new change${unreadCount > 1 ? "s" : ""}` : "Notifications"}
        aria-label="Notifications"
      >
        {hasUnread ? (
          <BellRing size={18} className="text-amber-300 animate-bellShake" />
        ) : (
          <Bell size={18} />
        )}

        {hasUnread && (
          <>
            <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#5E9E3A] z-10">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            <span className="absolute -top-0.5 -right-0.5 w-[17px] h-[17px] bg-red-500 rounded-full animate-ping opacity-60"></span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-scaleIn overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
              {hasUnread && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && hasUnread && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-[#5E9E3A] hover:text-[#4a8230] transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Inbox size={20} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No changes yet</p>
                <p className="text-xs text-slate-400 px-6">
                  You&apos;ll be notified here whenever any user modifies a project.
                </p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const isUnread = i < unreadCount;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-slate-50 last:border-b-0 transition-colors ${
                      isUnread ? "bg-amber-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${
                          isUnread ? "bg-[#5E9E3A] text-white" : "bg-slate-200 text-slate-600"
                        }`}
                        title={n.editedBy}
                      >
                        {(n.editedBy || "?").slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        {n.field === "created" ? (
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-semibold text-slate-900">@{n.editedBy}</span>{" "}
                            added a new project{" "}
                            <span className="font-medium text-slate-800">{n.projectNo}</span>
                            {n.ownerName ? (
                              <span className="text-slate-500"> ({n.ownerName})</span>
                            ) : null}
                          </p>
                        ) : (
                          <>
                            <p className="text-xs text-slate-700 leading-relaxed">
                              <span className="font-semibold text-slate-900">@{n.editedBy}</span>{" "}
                              updated{" "}
                              <span className="font-medium text-[#5E9E3A]">
                                {FIELD_LABELS[n.field] || n.field}
                              </span>{" "}
                              on{" "}
                              <span className="font-medium text-slate-800">
                                {n.projectNo}
                              </span>
                              {n.ownerName ? (
                                <span className="text-slate-500"> ({n.ownerName})</span>
                              ) : null}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] min-w-0">
                              <span
                                className="line-through text-slate-400 truncate max-w-[110px]"
                                title={n.oldValue}
                              >
                                {n.oldValue || "(empty)"}
                              </span>
                              <span className="text-slate-300 shrink-0">→</span>
                              <span
                                className="text-emerald-600 font-medium truncate max-w-[110px]"
                                title={n.newValue}
                              >
                                {n.newValue || "(empty)"}
                              </span>
                            </div>
                          </>
                        )}
                        <p className="mt-1 text-[10px] text-slate-400">{relativeTime(n.createdAt)}</p>
                      </div>
                      {isUnread && (
                        <span className="w-2 h-2 shrink-0 mt-1 rounded-full bg-red-500"></span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
