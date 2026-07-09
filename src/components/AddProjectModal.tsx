"use client";

import { useState, useEffect } from "react";
import { X, Save, Upload } from "lucide-react";
import type { Project } from "@/lib/types";
import {
  PROJECT_LOCATIONS,
  NOC_OPTIONS,
  PERSPECTIVE_3D_OPTIONS,
  ARCHITECTURE_OPTIONS,
  STRUCTURE_OPTIONS,
  STATUS_OPTIONS,
} from "@/lib/constants";

interface AddProjectModalProps {
  project: Project | null;
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy bg-white"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy"
      />
    </div>
  );
}

export default function AddProjectModal({ project, onSave, onClose }: AddProjectModalProps) {
  const [form, setForm] = useState({
    ownerName: "",
    projectNo: "",
    plotNo: "",
    projectLocation: "Abu Dhabi",
    noc: "Pending",
    perspective3d: "Pending",
    architecture: "Pending",
    structure: "Pending",
    status: "In Progress",
    contractor: "",
    remarks: "",
  });

  useEffect(() => {
    if (project) {
      setForm({
        ownerName: project.ownerName,
        projectNo: project.projectNo,
        plotNo: project.plotNo,
        projectLocation: project.projectLocation,
        noc: project.noc,
        perspective3d: project.perspective3d,
        architecture: project.architecture,
        structure: project.structure,
        status: project.status,
        contractor: project.contractor,
        remarks: project.remarks,
      });
    }
  }, [project]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ownerName || !form.projectNo) {
      alert("Owner Name and Project No are required");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-steel p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {project ? "Edit Project" : "Add New Project"}
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              {project ? "Update project details" : "Fill in the project details below"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextField
              label="Owner Name"
              value={form.ownerName}
              onChange={(v) => updateField("ownerName", v)}
              placeholder="Enter owner name"
              required
            />
            <TextField
              label="Project Number"
              value={form.projectNo}
              onChange={(v) => updateField("projectNo", v)}
              placeholder="e.g., PRJ-2024-001"
              required
            />
            <TextField
              label="Plot Number"
              value={form.plotNo}
              onChange={(v) => updateField("plotNo", v)}
              placeholder="e.g., PLT-101"
            />
            <SelectField
              label="Project Location"
              value={form.projectLocation}
              options={PROJECT_LOCATIONS}
              onChange={(v) => updateField("projectLocation", v)}
            />
            <SelectField
              label="NOC"
              value={form.noc}
              options={NOC_OPTIONS}
              onChange={(v) => updateField("noc", v)}
            />
            <SelectField
              label="3D Perspective"
              value={form.perspective3d}
              options={PERSPECTIVE_3D_OPTIONS}
              onChange={(v) => updateField("perspective3d", v)}
            />
            <SelectField
              label="Architecture"
              value={form.architecture}
              options={ARCHITECTURE_OPTIONS}
              onChange={(v) => updateField("architecture", v)}
            />
            <SelectField
              label="Structure"
              value={form.structure}
              options={STRUCTURE_OPTIONS}
              onChange={(v) => updateField("structure", v)}
            />
            <SelectField
              label="Status"
              value={form.status}
              options={STATUS_OPTIONS}
              onChange={(v) => updateField("status", v)}
            />
            <TextField
              label="Contractor"
              value={form.contractor}
              onChange={(v) => updateField("contractor", v)}
              placeholder="Contractor name"
            />
          </div>

          {/* Remarks */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => updateField("remarks", e.target.value)}
              rows={3}
              placeholder="Add any notes or remarks..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy resize-none"
            />
          </div>

          {/* File Uploads */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Drawings", "Approval Documents", "3D Images"].map((type) => (
              <div key={type}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Upload {type}</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-navy transition-colors cursor-pointer">
                  <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-xs text-slate-500">Click to upload</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light transition-colors flex items-center gap-2 shadow-md"
            >
              <Save size={16} />
              {project ? "Update Project" : "Add Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
