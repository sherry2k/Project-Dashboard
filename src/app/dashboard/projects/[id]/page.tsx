"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import type { Project, AuditLog, ConstructionStage } from "@/lib/types";
import {
  getCurrentActivity,
  getWaitingFor,
  getSoilInvestigationStatus,
  getWorkflowSteps,
  getConsultancyProgress,
  getConstructionProgress,
  getCurrentConstructionStage,
  type WorkflowState,
} from "@/lib/projectHelpers";
import { STATUS_COLORS, CONSTRUCTION_STAGE_TEMPLATES } from "@/lib/constants";
import { format } from "date-fns";




const STAGE_FIELD_MAP: Record<string, string> = {
  "Municipality (NOC)": "noc",
  "3D Perspective": "perspective3d",
  "Architecture": "architecture",
  "Structure": "structure",
  "Permit": "status",
  "Tender": "status",
  "Contractor Assignment": "contractor",
};

function getStageDetail(field: string, logs: AuditLog[]) {
  const fieldLogs = logs
    .filter((l) => l.field === field)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (fieldLogs.length === 0) return null;

  const first = fieldLogs[0];
  const last = fieldLogs[fieldLogs.length - 1];
  const started = new Date(first.createdAt);
  const completed = new Date(last.createdAt);

  if (isNaN(started.getTime()) || isNaN(completed.getTime())) return null;

  const durationDays = Math.max(0, Math.round((completed.getTime() - started.getTime()) / 86400000));

  return {
    started,
    completed,
    durationDays,
    lastEditedBy: last.editedBy,
    currentValue: last.newValue,
    history: fieldLogs,
  };
}
const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  noc: "NOC",
  architecture: "Architecture",
  structure: "Structure",
  perspective3d: "3D Perspective",
  contractor: "Contractor",
  remarks: "Remarks",
  soilReportRequestedDate: "🧪 Soil report requested date",
  soilReportExpectedDate: "🧪 Soil report expected date",
  soilReportActualDate: "🧪 Soil report received",
  soilReportLab: "Soil report lab",
  soilReportRequired: "Soil report requirement",
  siteProgressPercent: "Site progress",
};


/** Fields whose every change is worth showing in the activity feed. Skip noisy/low-value fields. */
const ACTIVITY_VISIBLE_FIELDS = new Set([
  "status",
  "noc",
  "architecture",
  "structure",
  "perspective3d",
  "contractor",
  "soilReportRequestedDate",
  "soilReportExpectedDate",
  "soilReportActualDate",
]);

function formatActivityLine(log: AuditLog): string | null {
  if (!ACTIVITY_VISIBLE_FIELDS.has(log.field)) return null;

  const label = FIELD_LABELS[log.field] || log.field;
  const isSoilDateField = [
    "soilReportRequestedDate",
    "soilReportExpectedDate",
    "soilReportActualDate",
  ].includes(log.field);

  if (isSoilDateField) {
    const parsed = new Date(log.newValue);
    const isValidDate = !isNaN(parsed.getTime());
    const dateText = isValidDate ? format(parsed, "dd MMM yyyy") : "an unknown date";

    if (log.field === "soilReportRequestedDate") {
      return `🧪 Soil report requested date set to ${dateText}`;
    }
    if (log.field === "soilReportExpectedDate") {
      return `🧪 Soil report expected date changed to ${dateText}`;
    }
    if (log.field === "soilReportActualDate") {
      return `🧪 Soil report received on ${dateText}`;
    }
  }

  if (log.field === "status" && log.newValue === "In Progress") {
    return "Soil investigation started";
  }
  if (log.field === "status") {
    return `Status changed to ${log.newValue}`;
  }

  return `${label} changed to ${log.newValue}`;
}


function WorkflowStepIcon({ state }: { state: WorkflowState }) {
  if (state === "done") {
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
        ✓
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="w-7 h-7 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center shrink-0">
        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full border-2 border-slate-300 shrink-0"></div>
  );
}

function ConfigureStagesPanel({
  existingStages,
  onSave,
  onClose,
}: {
  existingStages: ConstructionStage[];
  onSave: (stages: { stageName: string; weight: number }[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (existingStages.length > 0) {
      existingStages.forEach((s) => {
        initial[s.stageName] = s.weight;
      });
    } else {
      CONSTRUCTION_STAGE_TEMPLATES.forEach((t) => {
        if (t.defaultWeight > 0) initial[t.name] = t.defaultWeight;
      });
    }
    return initial;
  });

  const toggleStage = (name: string, defaultWeight: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (name in next) {
        delete next[name];
      } else {
        next[name] = defaultWeight;
      }
      return next;
    });
  };

  const updateWeight = (name: string, weight: number) => {
    setSelected((prev) => ({ ...prev, [name]: weight }));
  };

  const totalWeight = Object.values(selected).reduce((sum, w) => sum + w, 0);

  const handleSave = () => {
    const stages = Object.entries(selected).map(([stageName, weight]) => ({ stageName, weight }));
    onSave(stages);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Configure Construction Stages</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Select the stages that apply to this project and adjust their weights so they total 100%.
        </p>

        <div className="space-y-2">
          {CONSTRUCTION_STAGE_TEMPLATES.map((template) => {
            const isSelected = template.name in selected;
            return (
              <div key={template.name} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleStage(template.name, template.defaultWeight || 10)}
                  className="rounded border-slate-300 accent-[#5E9E3A]"
                />
                <span className={`flex-1 text-sm ${isSelected ? "text-slate-800 font-medium" : "text-slate-400"}`}>
                  {template.name}
                </span>
                {isSelected && (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={selected[template.name]}
                    onChange={(e) => updateWeight(template.name, Number(e.target.value))}
                    className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-sm text-right"
                  />
                )}
                {isSelected && <span className="text-xs text-slate-400 w-3">%</span>}
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 mt-4 pt-4 flex items-center justify-between">
          <p className={`text-sm font-medium ${totalWeight === 100 ? "text-emerald-600" : "text-amber-600"}`}>
            Total: {totalWeight}%
          </p>
          {totalWeight !== 100 && (
            <p className="text-xs text-amber-600">Should total 100%</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#5E9E3A] rounded-lg hover:bg-[#5E9E3A]/90 transition-colors"
          >
            Save Stages
          </button>
        </div>
      </div>
    </div>
  );
}


export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
const [constructionStages, setConstructionStages] = useState<ConstructionStage[]>([]);
const [showConstructionPanel, setShowConstructionPanel] = useState(false);
const [showConfigPanel, setShowConfigPanel] = useState(false);
  

 useEffect(() => {
  fetch(`/api/projects/${params.id}`)
    .then((res) => {
      if (!res.ok) throw new Error("not found");
      return res.json();
    })
    .then((data) => setProject(data))
    .catch(() => setNotFound(true))
    .finally(() => setLoading(false));

  fetch(`/api/audit?projectId=${params.id}&limit=100`)
    .then((res) => res.json())
    .then((data) => setAuditLogs(data))
    .catch(() => setAuditLogs([]));
}, [params.id]);

  const fetchConstructionStages = () => {
  fetch(`/api/projects/${params.id}/construction-stages`)
    .then((res) => res.json())
    .then((data) => setConstructionStages(data))
    .catch(() => setConstructionStages([]));
};

  const updateStage = async (stageId: number, data: Record<string, unknown>) => {
  await fetch(`/api/construction-stages/${stageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  fetchConstructionStages();
};

const saveAllStages = async () => {
  try {
    await Promise.all(
      constructionStages.map((stage) =>
        fetch(`/api/construction-stages/${stage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            status: stage.status, 
            subPercent: stage.subPercent 
          }),
        })
      )
    );
    // Fetch fresh data AFTER all PATCH requests complete
    await fetchConstructionStages();
    setShowConstructionPanel(false);
  } catch (error) {
    console.error("Failed to save stages:", error);
  }
};
  
/** Cycle a stage: pending → active → done → pending and update local state */
const cycleStage = (stage: ConstructionStage) => {
  let next: { status: "pending" | "active" | "done"; subPercent: number };

  if (stage.status === "pending") {
    next = { status: "active", subPercent: stage.subPercent > 0 ? stage.subPercent : 0 };
  } else if (stage.status === "active") {
    next = { status: "done", subPercent: 100 };
  } else {
    next = { status: "pending", subPercent: 0 };
  }

  setConstructionStages((prev) =>
    prev.map((s) => (s.id === stage.id ? { ...s, ...next } : s))
  );
};

const saveStageConfig = async (selected: { stageName: string; weight: number }[]) => {
  await fetch(`/api/projects/${params.id}/construction-stages`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stages: selected }),
  });
  setShowConfigPanel(false);
  fetchConstructionStages();
};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#5E9E3A]" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Project not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-[#5E9E3A] text-white rounded-lg text-sm font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activity = getCurrentActivity(project);
  const waitingFor = getWaitingFor(project);
  const soilStatus = getSoilInvestigationStatus(project);
  const statusColor = STATUS_COLORS[project.status] || { bg: "bg-gray-100", text: "text-gray-700" };
return (
    <div className="min-h-screen bg-[#F1F5F9]">
 <div className="bg-gradient-to-r from-[#5E9E3A] to-[#4a8230] px-4 sm:px-6 py-4 sm:py-5">
  <div className="flex items-center justify-between mb-3 sm:mb-0 sm:absolute sm:top-5 sm:left-6 sm:right-6">
    <button
      onClick={() => router.push("/dashboard")}
      className="flex items-center gap-1.5 sm:gap-2 bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0"
    >
      <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to Dashboard</span>
    </button>

    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
      <img src="/images/logo.png" alt="UBEC" className="w-10 h-10 sm:w-7 sm:h-7 object-contain" />
    </div>
  </div>

  <div className="text-center sm:pt-9">
    <h1 className="text-xl sm:text-2xl font-bold text-white">{project.projectNo}</h1>
    <p className="text-green-100 text-xs sm:text-sm mt-1">
      {project.ownerName} <span className="text-white/40 mx-1.5">|</span> Plot {project.plotNo} <span className="text-white/40 mx-1.5">|</span> {project.projectLocation}
    </p>
  </div>
</div>
<main className="px-6 py-6 max-w-6xl mx-auto">
        <div className="flex flex-col gap-4">

          {/* Management Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Management Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Current Activity</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  {activity.icon} {activity.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Waiting For</p>
                {waitingFor ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                    {waitingFor.icon} {waitingFor.label}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 italic">Nothing pending</span>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Soil Investigation</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${soilStatus.badgeColor}`}>
                  {soilStatus.status}
                </span>
                {soilStatus.detail && <p className="text-xs text-slate-500 mt-1">{soilStatus.detail}</p>}
                {soilStatus.percent !== null && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden max-w-[160px]">
                    <div className={`h-full ${soilStatus.color}`} style={{ width: `${soilStatus.percent}%` }}></div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Contractor</p>
                {project.contractor?.trim() ? (
                  <p className="text-sm font-medium text-slate-800">{project.contractor}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not assigned yet</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Last Updated</p>
                <p className="text-sm text-slate-700">
                  {project.updatedAt ? format(new Date(project.updatedAt), "dd MMM yyyy — HH:mm") : "—"}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <p className="text-xs text-slate-500 mb-1.5">Remarks</p>
                {project.remarks?.trim() ? (
                  <p className="text-sm text-slate-700">{project.remarks}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No remarks added</p>
                )}
              </div>
            </div>
          </div>
     
            {/* Progress Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">Progress Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-700">Consultancy / Approval</p>
                    <p className="text-sm font-bold text-slate-800">{getConsultancyProgress(project)}%</p>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${getConsultancyProgress(project)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Registration → NOC → Architecture → Structure → Permit</p>
                </div>
              <div className="cursor-pointer hover:bg-slate-50 rounded-lg -mx-2 px-2 py-1 transition-colors">
  <div
    onClick={() => setShowConstructionPanel(true)}
  >
    <div className="flex items-center justify-between mb-1.5">
      <p className="text-sm font-medium text-slate-700">Site / Construction</p>
      <p className="text-sm font-bold text-slate-800">{getConstructionProgress(constructionStages)}%</p>
    </div>
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#5E9E3A] transition-all"
        style={{ width: `${getConstructionProgress(constructionStages)}%` }}
      ></div>
    </div>
    {getCurrentConstructionStage(constructionStages) && (
      <p className="text-xs text-slate-400 mt-1.5">
        Current Stage: {getCurrentConstructionStage(constructionStages)}
      </p>
    )}
  </div>
  <button
    onClick={(e) => { e.stopPropagation(); setShowConstructionPanel(true); }}
    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
  >
    🔧 Update Construction Progress
  </button>
</div>
              </div>
            </div>

            {/* Workflow */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">Workflow</h2>
              <div>
               {getWorkflowSteps(project).map((step, i, arr) => (
  <div key={step.label} className="flex gap-3">
    <div className="flex flex-col items-center">
      <WorkflowStepIcon state={step.state} />
      {i < arr.length - 1 && (
        <div className={`w-0.5 flex-1 min-h-[28px] ${step.state === "done" ? "bg-emerald-300" : "bg-slate-200"}`}></div>
      )}
    </div>
    <div
      onClick={() => setSelectedStage(step.label)}
      className="pb-6 flex-1 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 rounded-lg -mx-2 px-2 transition-colors"
    >
      <div>
        <p className={`text-sm font-medium ${step.state === "pending" ? "text-slate-400" : "text-slate-800"}`}>
          {step.label}
        </p>
        {step.detail && (
          <p className="text-xs text-amber-600 mt-0.5">{step.detail}</p>
        )}
        {step.state === "done" && !step.detail && (
          <p className="text-xs text-emerald-600 mt-0.5">Done</p>
        )}
        {step.state === "pending" && (
          <p className="text-xs text-slate-400 mt-0.5">Pending</p>
        )}
      </div>
      {step.state === "active" && project.updatedAt && (
        <p className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
          {format(new Date(project.updatedAt), "dd MMM yyyy")}
        </p>
      )}
    </div>
  </div>
))}
              </div>
            </div>
         
        </div>
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Activity History</h2>
  {auditLogs.length === 0 ? (
    <p className="text-sm text-slate-400 italic">No activity recorded yet.</p>
  ) : (
    <div className="space-y-2.5">
  {auditLogs
    .map((log) => ({ log, text: formatActivityLine(log) }))
    .filter((item): item is { log: AuditLog; text: string } => item.text !== null)
    .slice(0, 10)
    .map(({ log, text }) => (
      <div key={log.id} className="flex items-center gap-3 text-sm">
        <span className="text-slate-400 shrink-0 w-16">{format(new Date(log.createdAt), "dd MMM")}</span>
        <span className="text-slate-700">{text}</span>
      </div>
    ))}
</div>
  )}
{showConstructionPanel && (
  <div
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    onClick={() => setShowConstructionPanel(false)}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Construction Progress</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfigPanel(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Configure Stages
          </button>
          <button onClick={() => setShowConstructionPanel(false)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      </div>

      {constructionStages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400 italic mb-3">No construction stages configured yet.</p>
          <button
            onClick={() => setShowConfigPanel(true)}
            className="px-4 py-2 bg-[#5E9E3A] text-white rounded-lg text-sm font-medium"
          >
            Set Up Stages
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-1">
  {constructionStages.map((stage) => (
    <div key={stage.id} className={`py-2 px-2 rounded-lg transition-colors ${stage.status === "active" ? "bg-amber-50" : "hover:bg-slate-50"}`}>
      <div
        onClick={() => cycleStage(stage)}
        className="flex items-center gap-3 cursor-pointer"
      >
        <div className="shrink-0">
          {stage.status === "done" ? (
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">✓</div>
          ) : stage.status === "active" ? (
            <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${stage.status === "pending" ? "text-slate-400" : "text-slate-800"}`}>
            {stage.stageName}
            {stage.status === "active" && <span className="text-xs font-normal text-slate-400"> — active stage</span>}
          </p>
        </div>
        <p className="text-xs text-slate-400 shrink-0">{stage.weight}%</p>
      </div>

       {stage.status === "active" && (
  <div
    className="flex items-center gap-2.5 mt-2 pl-9"
    onClick={(e) => e.stopPropagation()}
  >
    <input
  type="range"
  min={0}
  max={100}
  step={5}
  value={stage.subPercent}
  onChange={(e) => {
    const newValue = Number(e.target.value);
    setConstructionStages((prev) =>
      prev.map((s) => {
        if (s.id !== stage.id) return s;
        
        // Auto-compute status based on slider value!
        let computedStatus: "pending" | "active" | "done" = s.status;
        if (newValue === 100) {
          computedStatus = "done";
        } else if (newValue > 0) {
          computedStatus = "active";
        } else {
          computedStatus = "pending";
        }

        return { ...s, subPercent: newValue, status: computedStatus };
      })
    );
  }}
  className="flex-1 accent-amber-500"
/>
    <span className="text-xs font-medium text-amber-700 w-9 text-right">{stage.subPercent}%</span>
  </div>
)}
</div>
  ))}
</div>

          <div className="border-t border-slate-200 mt-4 pt-4">
  <div className="flex items-center justify-between mb-1.5">
    <p className="text-sm font-semibold text-slate-700">Overall Construction Progress</p>
    <p className="text-sm font-bold text-slate-800">{getConstructionProgress(constructionStages)}%</p>
  </div>
  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
    <div
      className="h-full bg-[#5E9E3A] transition-all"
      style={{ width: `${getConstructionProgress(constructionStages)}%` }}
    ></div>
  </div>

  <div className="flex items-center justify-end gap-3 mt-5">
    <button
      onClick={() => { fetchConstructionStages(); setShowConstructionPanel(false); }}
      className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
    >
      Cancel
    </button>
    <button
      onClick={saveAllStages}
      className="px-4 py-2 text-sm font-medium text-white bg-[#5E9E3A] rounded-lg hover:bg-[#5E9E3A]/90 transition-colors"
    >
      Save
    </button>
  </div>
</div>
        </>
      )}
    </div>
  </div>
)}
  {showConfigPanel && (
  <ConfigureStagesPanel
    existingStages={constructionStages}
    onSave={saveStageConfig}
    onClose={() => setShowConfigPanel(false)}
  />
)}
    {selectedStage && (() => {
  const fieldName = STAGE_FIELD_MAP[selectedStage];
  const detail = fieldName ? getStageDetail(fieldName, auditLogs) : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => setSelectedStage(null)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{selectedStage}</h3>
          <button onClick={() => setSelectedStage(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {detail ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className="text-sm font-medium text-slate-800">{detail.currentValue}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Started</p>
                <p className="text-sm text-slate-700">{format(detail.started, "dd MMM yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm text-slate-700">{format(detail.completed, "dd MMM yyyy")}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Duration</p>
              <p className="text-sm text-slate-700">{detail.durationDays} days</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Last Updated By</p>
              <p className="text-sm text-slate-700">{detail.lastEditedBy}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No history recorded for this stage yet.</p>
        )}
      </div>
    </div>
  );
})()}
  </div>
      </main>
    </div>
  );
}
