"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Eye,
  Pencil,
  Copy,
  Trash2,
  Archive,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Download,
  Printer,
  Loader2,
  X,
} from "lucide-react";
import type { Project } from "@/lib/types";
import {
  STATUS_COLORS,
  NOC_COLORS,
  ARCH_COLORS,
  STRUCT_COLORS,
  PERSPECTIVE_COLORS,
  STATUS_OPTIONS,
  NOC_OPTIONS,
  ARCHITECTURE_OPTIONS,
  STRUCTURE_OPTIONS,
  PERSPECTIVE_3D_OPTIONS,
  PROJECT_LOCATIONS,
} from "@/lib/constants";
import { format } from "date-fns";

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  onUpdate: (id: number, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onDuplicate: (id: number) => Promise<void>;
  onArchive: (id: number) => Promise<void>;
  onEdit: (project: Project) => void;
}

type SortDir = "asc" | "desc" | null;

interface EditingCell {
  rowId: number;
  field: string;
}

function StatusBadge({ value, colors }: { value: string; colors: Record<string, { bg: string; text: string; dot?: string }> }) {
  const c = colors[value] || { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium status-badge ${c.bg} ${c.text}`}>
      {"dot" in c && c.dot && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>}
      {value}
    </span>
  );
}

function InlineDropdown({
  value,
  options,
  onChange,
  onClose,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[180px] animate-scaleIn max-h-64 overflow-y-auto">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => { onChange(opt); onClose(); }}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
            opt === value ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function InlineTextEdit({
  value,
  onSave,
  onClose,
}: {
  value: string;
  onSave: (v: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { onSave(text); onClose(); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { onSave(text); onClose(); }
        if (e.key === "Escape") onClose();
      }}
      className="w-full bg-white border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  );
}

export default function ProjectTable({
  projects,
  loading,
  onUpdate,
  onDelete,
  onDuplicate,
  onArchive,
  onEdit,
}: ProjectTableProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActionMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortField(null);
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (!sortField || !sortDir) return 0;
    const aVal = String((a as unknown as Record<string, unknown>)[sortField] || "");
    const bVal = String((b as unknown as Record<string, unknown>)[sortField] || "");
    return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const handleCellEdit = useCallback(
    async (id: number, field: string, value: string) => {
      await onUpdate(id, { [field]: value });
      setEditingCell(null);
    },
    [onUpdate]
  );

  const dropdownFields: Record<string, readonly string[]> = {
    noc: NOC_OPTIONS,
    perspective3d: PERSPECTIVE_3D_OPTIONS,
    architecture: ARCHITECTURE_OPTIONS,
    structure: STRUCTURE_OPTIONS,
    status: STATUS_OPTIONS,
    projectLocation: PROJECT_LOCATIONS,
  };

  const badgeFields: Record<string, Record<string, { bg: string; text: string; dot?: string }>> = {
    status: STATUS_COLORS,
    noc: NOC_COLORS,
    architecture: ARCH_COLORS,
    structure: STRUCT_COLORS,
    perspective3d: PERSPECTIVE_COLORS,
  };

  const columns = [
    { key: "sno", label: "S.No", width: "w-14", sortable: false },
    { key: "ownerName", label: "Owner Name", width: "min-w-[160px]", sortable: true },
    { key: "projectNo", label: "Project No", width: "min-w-[120px]", sortable: true },
    { key: "plotNo", label: "Plot No", width: "min-w-[100px]", sortable: true },
    { key: "projectLocation", label: "Project Location", width: "min-w-[160px]", sortable: true },
    { key: "noc", label: "NOC", width: "min-w-[120px]", sortable: true },
    { key: "perspective3d", label: "3D Perspective", width: "min-w-[140px]", sortable: true },
    { key: "architecture", label: "Architecture", width: "min-w-[130px]", sortable: true },
    { key: "structure", label: "Structure", width: "min-w-[130px]", sortable: true },
    { key: "status", label: "Status", width: "min-w-[160px]", sortable: true },
    { key: "contractor", label: "Contractor", width: "min-w-[150px]", sortable: true },
    { key: "remarks", label: "Remarks", width: "min-w-[200px]", sortable: false },
    { key: "updatedAt", label: "Last Updated", width: "min-w-[140px]", sortable: true },
    { key: "actions", label: "Actions", width: "w-20", sortable: false },
  ];

  const handleSelectAll = () => {
    if (selectedRows.size === projects.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(projects.map((p) => p.id)));
    }
  };

  const handleSelectRow = (id: number) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const exportCSV = () => {
    const headers = ["S.No", "Owner Name", "Project No", "Plot No", "Location", "NOC", "3D Perspective", "Architecture", "Structure", "Status", "Contractor", "Remarks", "Last Updated"];
    const rows = sortedProjects.map((p, i) => [
      i + 1, p.ownerName, p.projectNo, p.plotNo, p.projectLocation,
      p.noc, p.perspective3d, p.architecture, p.structure, p.status,
      p.contractor, p.remarks, p.updatedAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 px-4 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-700">
            {projects.length} Projects
          </h2>
          {selectedRows.size > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {selectedRows.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={14} />
                Clear
              </button>
              <button
                onClick={async () => {
                  const count = selectedRows.size;
                  if (confirm(`Archive ${count} project${count > 1 ? "s" : ""}? You can restore them later from the archive.`)) {
                    for (const id of selectedRows) {
                      await onArchive(id);
                    }
                    setSelectedRows(new Set());
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Archive size={14} />
                Archive
              </button>
              <button
                onClick={async () => {
                  const count = selectedRows.size;
                  if (confirm(`⚠️ Delete ${count} project${count > 1 ? "s" : ""}? This action cannot be undone!`)) {
                    for (const id of selectedRows) {
                      await onDelete(id);
                    }
                    setSelectedRows(new Set());
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
              >
                <Trash2 size={14} />
                Delete {selectedRows.size}
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
            </>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container bg-white rounded-b-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === projects.length && projects.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 accent-navy"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${col.width} ${
                      col.key === "sno" ? "sticky left-10 bg-slate-50 z-10" : ""
                    } ${col.sortable ? "cursor-pointer hover:text-slate-800 select-none" : ""}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortField === col.key && (
                        sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={32} className="animate-spin text-steel" />
                      <p className="text-sm text-slate-500">Loading projects...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Archive size={24} className="text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500">No projects found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${
                      selectedRows.has(project.id) ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(project.id)}
                        onChange={() => handleSelectRow(project.id)}
                        className="rounded border-slate-300 accent-navy"
                      />
                    </td>

                    {/* S.No */}
                    <td className="px-3 py-2 text-sm text-slate-500 font-medium sticky left-10 bg-white z-10">
                      {index + 1}
                    </td>

                    {/* Editable text fields */}
                    {(["ownerName", "projectNo", "plotNo"] as const).map((field) => (
                      <td key={field} className="px-3 py-2">
                        {editingCell?.rowId === project.id && editingCell?.field === field ? (
                          <InlineTextEdit
                            value={project[field]}
                            onSave={(v) => handleCellEdit(project.id, field, v)}
                            onClose={() => setEditingCell(null)}
                          />
                        ) : (
                          <div
                            className="editable-cell text-sm text-slate-800"
                            onDoubleClick={() => setEditingCell({ rowId: project.id, field })}
                          >
                            {project[field] || <span className="text-slate-300">—</span>}
                          </div>
                        )}
                      </td>
                    ))}

                    {/* Dropdown fields */}
                    {(["projectLocation", "noc", "perspective3d", "architecture", "structure", "status"] as const).map((field) => (
                      <td key={field} className="px-3 py-2 relative">
                        {editingCell?.rowId === project.id && editingCell?.field === field ? (
                          <InlineDropdown
                            value={project[field]}
                            options={dropdownFields[field]}
                            onChange={(v) => handleCellEdit(project.id, field, v)}
                            onClose={() => setEditingCell(null)}
                          />
                        ) : (
                          <div
                            className="editable-cell cursor-pointer"
                            onDoubleClick={() => setEditingCell({ rowId: project.id, field })}
                          >
                            {badgeFields[field] ? (
                              <StatusBadge value={project[field]} colors={badgeFields[field]} />
                            ) : (
                              <span className="text-sm text-slate-700">{project[field]}</span>
                            )}
                          </div>
                        )}
                      </td>
                    ))}

                    {/* Contractor */}
                    <td className="px-3 py-2">
                      {editingCell?.rowId === project.id && editingCell?.field === "contractor" ? (
                        <InlineTextEdit
                          value={project.contractor}
                          onSave={(v) => handleCellEdit(project.id, "contractor", v)}
                          onClose={() => setEditingCell(null)}
                        />
                      ) : (
                        <div
                          className="editable-cell text-sm text-slate-700"
                          onDoubleClick={() => setEditingCell({ rowId: project.id, field: "contractor" })}
                        >
                          {project.contractor || <span className="text-slate-300">—</span>}
                        </div>
                      )}
                    </td>

                    {/* Remarks */}
                    <td className="px-3 py-2">
                      {editingCell?.rowId === project.id && editingCell?.field === "remarks" ? (
                        <InlineTextEdit
                          value={project.remarks}
                          onSave={(v) => handleCellEdit(project.id, "remarks", v)}
                          onClose={() => setEditingCell(null)}
                        />
                      ) : (
                        <div
                          className="editable-cell text-sm text-slate-600 max-w-[200px] truncate"
                          onDoubleClick={() => setEditingCell({ rowId: project.id, field: "remarks" })}
                          title={project.remarks}
                        >
                          {project.remarks || <span className="text-slate-300">—</span>}
                        </div>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {project.updatedAt ? format(new Date(project.updatedAt), "dd MMM yyyy HH:mm") : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === project.id ? null : project.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <MoreHorizontal size={16} className="text-slate-400" />
                      </button>

                      {actionMenu === project.id && (
                        <div ref={menuRef} className="absolute right-0 top-full z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[160px] animate-scaleIn">
                          <button
                            onClick={() => { setViewProject(project); setActionMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={14} /> View Details
                          </button>
                          <button
                            onClick={() => { onEdit(project); setActionMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => { onDuplicate(project.id); setActionMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Copy size={14} /> Duplicate
                          </button>
                          <button
                            onClick={() => { onArchive(project.id); setActionMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Archive size={14} /> Archive
                          </button>
                          <hr className="my-1 border-slate-100" />
                          <button
                            onClick={() => {
                              if (confirm("Delete this project?")) {
                                onDelete(project.id);
                              }
                              setActionMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Project Modal */}
      {viewProject && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4" onClick={() => setViewProject(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#5E9E3A] to-[#4a8230] p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Project Details</h2>
              <p className="text-blue-200 text-sm mt-1">{viewProject.projectNo}</p>
            </div>
            <div className="p-6 space-y-4">
              {[
                ["Owner Name", viewProject.ownerName],
                ["Project No", viewProject.projectNo],
                ["Plot No", viewProject.plotNo],
                ["Location", viewProject.projectLocation],
                ["NOC", viewProject.noc],
                ["3D Perspective", viewProject.perspective3d],
                ["Architecture", viewProject.architecture],
                ["Structure", viewProject.structure],
                ["Status", viewProject.status],
                ["Contractor", viewProject.contractor],
                ["Remarks", viewProject.remarks],
                ["Last Updated", viewProject.updatedAt ? format(new Date(viewProject.updatedAt), "dd MMM yyyy HH:mm") : "—"],
                ["Last Edited By", viewProject.lastEditedBy],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start gap-4">
                  <span className="text-sm font-medium text-slate-500 w-36 shrink-0">{label}</span>
                  <span className="text-sm text-slate-800">{value || "—"}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewProject(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
