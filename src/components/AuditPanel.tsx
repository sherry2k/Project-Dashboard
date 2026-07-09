"use client";

import { X, Clock } from "lucide-react";
import type { AuditLog } from "@/lib/types";
import { format } from "date-fns";

interface AuditPanelProps {
  logs: AuditLog[];
  onClose: () => void;
}

const fieldLabels: Record<string, string> = {
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

export default function AuditPanel({ logs, onClose }: AuditPanelProps) {
  return (
    <div className="w-80 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm h-fit sticky top-20 animate-slideIn no-print max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-navy" />
          <h3 className="text-sm font-semibold text-slate-800">Activity Log</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <X size={14} className="text-slate-500" />
        </button>
      </div>

      <div className="p-4">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border-l-2 border-blue-200 pl-3 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-navy">Project #{log.projectId}</span>
                  <span className="text-xs text-slate-400">
                    {format(new Date(log.createdAt), "dd MMM HH:mm")}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  <span className="font-medium">{log.editedBy}</span> changed{" "}
                  <span className="font-medium text-navy">{fieldLabels[log.field] || log.field}</span>
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="line-through text-slate-400 truncate max-w-[100px]" title={log.oldValue}>
                    {log.oldValue || "(empty)"}
                  </span>
                  <span className="text-slate-300">→</span>
                  <span className="text-emerald-600 font-medium truncate max-w-[100px]" title={log.newValue}>
                    {log.newValue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
