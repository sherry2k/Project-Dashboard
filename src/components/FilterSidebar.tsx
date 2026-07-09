"use client";

import { X, RotateCcw } from "lucide-react";
import {
  STATUS_OPTIONS,
  NOC_OPTIONS,
  ARCHITECTURE_OPTIONS,
  STRUCTURE_OPTIONS,
  PROJECT_LOCATIONS,
} from "@/lib/constants";

interface FilterSidebarProps {
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onClose: () => void;
}

function FilterSection({
  label,
  field,
  options,
  value,
  onChange,
}: {
  label: string;
  field: string;
  options: readonly string[];
  value: string;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</h4>
      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(field, value === opt ? "" : opt)}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
              value === opt
                ? "bg-[#5E9E3A] text-white font-medium"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterSidebar({ filters, onFilterChange, onClose }: FilterSidebarProps) {
  const handleChange = (field: string, value: string) => {
    const next = { ...filters };
    if (value) {
      next[field] = value;
    } else {
      delete next[field];
    }
    onFilterChange(next);
  };

  const clearAll = () => onFilterChange({});
  const activeCount = Object.keys(filters).length;

  return (
    <div className="w-64 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm h-fit sticky top-20 animate-slideIn no-print max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
          {activeCount > 0 && (
            <span className="text-xs bg-[#5E9E3A] text-white px-1.5 py-0.5 rounded-full">{activeCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeCount > 0 && (
            <button onClick={clearAll} className="p-1 hover:bg-slate-100 rounded-lg transition-colors" title="Clear all">
              <RotateCcw size={14} className="text-slate-500" />
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={14} className="text-slate-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        <FilterSection label="Status" field="status" options={STATUS_OPTIONS} value={filters.status || ""} onChange={handleChange} />
        <FilterSection label="Location" field="location" options={PROJECT_LOCATIONS} value={filters.location || ""} onChange={handleChange} />
        <FilterSection label="NOC" field="noc" options={NOC_OPTIONS} value={filters.noc || ""} onChange={handleChange} />
        <FilterSection label="Architecture" field="architecture" options={ARCHITECTURE_OPTIONS} value={filters.architecture || ""} onChange={handleChange} />
        <FilterSection label="Structure" field="structure" options={STRUCTURE_OPTIONS} value={filters.structure || ""} onChange={handleChange} />
      </div>
    </div>
  );
}
