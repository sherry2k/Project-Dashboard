"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import type { Project } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/constants";
import { format } from "date-fns";

function getCurrentActivity(project: Project): { icon: string; label: string } {
  if (project.status === "Project Cancelled") return { icon: "❌", label: "Cancelled" };
  if (project.status === "On Hold") return { icon: "⏸", label: "On Hold" };
  if (project.status === "Completed") return { icon: "✅", label: "Completed" };
  if (project.status === "Waiting Payment" || project.noc === "Waiting Payment") return { icon: "💰", label: "Payment" };
  if (project.status === "Waiting Tender") return { icon: "📋", label: "Tender" };
  if (project.status === "Waiting Soil Report") return { icon: "🧪", label: "Soil Investigation" };
  if (project.status === "Waiting Owner") return { icon: "👤", label: "Waiting Owner" };
  if (project.status === "Permit Issued") return { icon: "📄", label: "Permit Processed" };
  if (
    ["Pending", "Waiting", "Submitted"].includes(project.noc) ||
    project.architecture === "Submitted" ||
    project.structure === "Submitted"
  ) {
    return { icon: "🏛", label: "Municipality Review" };
  }
  if (["In Progress", "Pending", "Comments"].includes(project.structure)) return { icon: "🏗", label: "Structure" };
  if (["In Progress", "Pending", "Comments"].includes(project.architecture)) return { icon: "📐", label: "Architecture" };
  if (["In Progress", "Pending"].includes(project.perspective3d)) return { icon: "🎨", label: "3D Perspective" };
  return { icon: "📌", label: project.status };
}

function getWaitingFor(project: Project): { icon: string; label: string } | null {
  if (project.soilReportRequestedDate && project.soilReportExpectedDate && !project.soilReportActualDate) {
    return { icon: "🧪", label: "Soil Report" };
  }
  if (["Pending", "Waiting", "Submitted"].includes(project.noc)) return { icon: "🏛", label: "Municipality Approval" };
  if (project.status === "Waiting Owner") return { icon: "👤", label: "Owner" };
  if (project.status === "Waiting Tender") return { icon: "📋", label: "Tender" };
  if (project.noc === "Waiting Payment") return { icon: "💰", label: "Payment" };
  return null;
}
type SoilStatus = "Not Required" | "Not Started" | "Requested" | "In Progress" | "Report Received" | "Overdue";

function getSoilInvestigationStatus(project: Project): {
  status: SoilStatus;
  detail?: string;
  percent: number | null;
  color: string;
  badgeColor: string;
} {
  if (project.soilReportRequired === "Not Required") {
    return { status: "Not Required", percent: null, color: "bg-slate-300", badgeColor: "bg-slate-100 text-slate-600" };
  }

  const requested = project.soilReportRequestedDate ? new Date(project.soilReportRequestedDate) : null;
  if (!requested) {
    return { status: "Not Started", percent: null, color: "bg-slate-300", badgeColor: "bg-slate-100 text-slate-500" };
  }

  const expected = project.soilReportExpectedDate ? new Date(project.soilReportExpectedDate) : null;
  const actual = project.soilReportActualDate ? new Date(project.soilReportActualDate) : null;
  const now = new Date();

  if (actual && actual.getTime() <= now.getTime()) {
    const daysTaken = Math.round((actual.getTime() - requested.getTime()) / 86400000);
    return {
      status: "Report Received",
      detail: `Took ${daysTaken} days`,
      percent: 100,
      color: "bg-emerald-500",
      badgeColor: "bg-emerald-100 text-emerald-800",
    };
  }

  if (!expected) {
    return { status: "Requested", percent: 5, color: "bg-blue-400", badgeColor: "bg-blue-100 text-blue-800" };
  }

  const totalDays = Math.round((expected.getTime() - requested.getTime()) / 86400000);
  const daysElapsed = Math.round((now.getTime() - requested.getTime()) / 86400000);
  const daysRemaining = totalDays - daysElapsed;
  const percent = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

  if (daysRemaining < 0) {
    return {
      status: "Overdue",
      detail: `${Math.abs(daysRemaining)} days overdue`,
      percent: 100,
      color: "bg-red-500",
      badgeColor: "bg-red-100 text-red-800",
    };
  }

  if (daysElapsed <= 1) {
    return { status: "Requested", percent, color: "bg-blue-400", badgeColor: "bg-blue-100 text-blue-800" };
  }

  return {
    status: "In Progress",
    detail: `${daysElapsed} / ${totalDays} days`,
    percent,
    color: daysRemaining <= totalDays * 0.25 ? "bg-amber-500" : "bg-emerald-500",
    badgeColor: "bg-amber-100 text-amber-800",
  };
}

type WorkflowState = "done" | "active" | "pending";

interface WorkflowStep {
  label: string;
  state: WorkflowState;
  detail?: string;
}

function getWorkflowSteps(project: Project): WorkflowStep[] {
  const archState: WorkflowState =
  project.architecture === "Approved" ? "done"
  : ["In Progress", "Ready", "Comments", "Submitted"].includes(project.architecture) ? "active"
  : "pending";

  const structState: WorkflowState =
  project.structure === "Approved" ? "done"
  : ["In Progress", "Comments", "Submitted"].includes(project.structure) ? "active"
  : "pending";

 const perspectiveState: WorkflowState =
  ["Ready", "Not Required"].includes(project.perspective3d) ? "done"
  : project.perspective3d === "In Progress" ? "active"
  : "pending";

  const nocState: WorkflowState =
    ["Done", "Not Required"].includes(project.noc) ? "done"
    : ["Pending", "Waiting", "Submitted"].includes(project.noc) ? "active"
    : "pending";

  const permitState: WorkflowState =
    ["Permit Issued", "Completed"].includes(project.status) ? "done"
    : project.status === "Waiting Owner" ? "active"
    : "pending";

  const tenderState: WorkflowState =
  ["Completed", "Permit Issued"].includes(project.status) || project.contractor?.trim() ? "done"
  : project.status === "Waiting Tender" ? "active"
  : "pending";

  const contractorState: WorkflowState =
  project.contractor?.trim() || ["Completed", "Permit Issued"].includes(project.status) ? "done" : "pending";

  return [
    { label: "Registration", state: "done" },
    { label: "Municipality (NOC)", state: nocState },
    { label: "3D Perspective", state: perspectiveState },
    { label: "Architecture", state: archState },
    { label: "Structure", state: structState },
    { label: "Permit", state: permitState },
    { label: "Tender", state: tenderState },
    { label: "Contractor Assignment", state: contractorState },
  ];
}

function getConsultancyProgress(project: Project): number {
  const steps = getWorkflowSteps(project);
  const relevant = steps.filter((s) => s.label !== "Contractor Assignment");
  const doneCount = relevant.filter((s) => s.state === "done").length;
  return Math.round((doneCount / relevant.length) * 100);
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => setProject(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

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
      <div className="bg-white border-b border-slate-200 px-6 py-3">
  <div className="max-w-6xl mx-auto flex items-center gap-4">
    <button
      onClick={() => router.push("/dashboard")}
      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors shrink-0"
    >
      <ArrowLeft size={16} /> Back
    </button>

    <div className="w-px h-6 bg-slate-200 shrink-0"></div>

    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
      <img src="/images/logo.png" alt="UBEC" className="w-6 h-6 object-contain" />
    </div>

    <h1 className="text-lg font-bold text-slate-800 shrink-0">{project.projectNo}</h1>

    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusColor.bg} ${statusColor.text}`}>
      {project.status}
    </span>

    <div className="w-px h-6 bg-slate-200 shrink-0"></div>

    <p className="text-sm text-slate-600 truncate">
      {project.ownerName} <span className="text-slate-300 mx-1">|</span> Plot {project.plotNo} <span className="text-slate-300 mx-1">|</span> {project.projectLocation}
    </p>
  </div>
</div>

      <main className="px-6 py-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">

          {/* Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-fit">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Info</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Location</p>
                <p className="text-sm font-medium text-slate-800">{project.projectLocation}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Contractor</p>
                {project.contractor?.trim() ? (
                  <p className="text-sm font-medium text-slate-800">{project.contractor}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not assigned yet</p>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                <p className="text-sm text-slate-700">
                  {project.updatedAt ? format(new Date(project.updatedAt), "dd MMM yyyy") : "—"}
                </p>
                <p className="text-xs text-slate-400">
                  {project.updatedAt ? format(new Date(project.updatedAt), "HH:mm") : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col gap-4">

            {/* Management Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Management Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text}`}>
                    {project.status}
                  </span>
                </div>
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
                <div className="sm:col-span-2">
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
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-700">Site / Construction</p>
                    <p className="text-sm font-bold text-slate-800">{project.siteProgressPercent ?? 0}%</p>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5E9E3A] transition-all"
                      style={{ width: `${project.siteProgressPercent ?? 0}%` }}
                    ></div>
                  </div>
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
                    <div className="pb-6 flex-1 flex items-start justify-between gap-4">
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
        </div>
      </main>
    </div>
  );
}
