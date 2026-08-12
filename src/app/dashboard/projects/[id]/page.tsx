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
  if (["Pending", "Waiting", "Submitted"].includes(project.noc)) return { icon: "🏛", label: "Municipality Review" };
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
function getSoilProgress(project: Project): { text: string; percent: number | null; color: string } | null {
  if (!project.soilReportRequestedDate || !project.soilReportExpectedDate) return null;
  const requested = new Date(project.soilReportRequestedDate);
  const expected = new Date(project.soilReportExpectedDate);
  const actual = project.soilReportActualDate ? new Date(project.soilReportActualDate) : null;

  if (actual && actual.getTime() <= Date.now()) {
    const daysTaken = Math.round((actual.getTime() - requested.getTime()) / 86400000);
    return { text: `Completed — took ${daysTaken} days`, percent: 100, color: "bg-emerald-500" };
  }

  const now = new Date();
  const totalDays = Math.round((expected.getTime() - requested.getTime()) / 86400000);
  const daysElapsed = Math.round((now.getTime() - requested.getTime()) / 86400000);
  const daysRemaining = totalDays - daysElapsed;
  const percent = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

  let color = "bg-emerald-500";
  if (daysRemaining < 0) color = "bg-red-500";
  else if (daysRemaining <= totalDays * 0.25) color = "bg-amber-500";

  return {
    text: daysRemaining < 0 ? `Overdue by ${Math.abs(daysRemaining)}d` : `${daysElapsed} / ${totalDays} days`,
    percent,
    color,
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
    : ["In Progress", "Ready", "Comments"].includes(project.architecture) ? "active"
    : "pending";

  const structState: WorkflowState =
    project.structure === "Approved" ? "done"
    : ["In Progress", "Comments"].includes(project.structure) ? "active"
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
  const soilProgress = getSoilProgress(project);
  const statusColor = STATUS_COLORS[project.status] || { bg: "bg-gray-100", text: "text-gray-700" };

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <div className="bg-gradient-to-r from-[#5E9E3A] to-[#4a8230] px-6 py-8 relative">
  <button
    onClick={() => router.push("/dashboard")}
    className="absolute top-5 left-6 flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
  >
    <ArrowLeft size={16} /> Back to Dashboard
  </button>

  <div className="absolute top-5 right-6 w-11 h-11 rounded-full bg-white flex items-center justify-center overflow-hidden">
  <img src="/images/logo.png" alt="UBEC" className="w-12 h-12 object-contain" />
</div>

  <div className="text-center pt-10">
  <p className="text-green-100 text-xs uppercase tracking-[0.15em] font-semibold mb-2">Project Overview</p>
  <h1 className="text-4xl font-bold text-white">{project.projectNo}</h1>
  <p className="text-green-100 text-xl font-semibold mt-2">{project.ownerName}</p>
  <p className="text-green-200 text-sm mt-1">Plot {project.plotNo} — {project.projectLocation}</p>
</div>
</div>

      <main className="px-6 py-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Management Summary</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
  <p className="text-xs text-slate-500 mb-1.5">Contractor</p>
  {project.contractor?.trim() ? (
    <span className="text-sm font-medium text-slate-800">{project.contractor}</span>
  ) : (
    <span className="text-sm text-slate-400 italic">Not assigned yet</span>
  )}
</div>

            <div>
              <p className="text-xs text-slate-500 mb-1.5">Soil Progress</p>
              {soilProgress ? (
                <div>
                  <p className="text-sm font-semibold text-slate-800">{soilProgress.text}</p>
                  {soilProgress.percent !== null && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full ${soilProgress.color}`} style={{ width: `${soilProgress.percent}%` }}></div>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm text-slate-400 italic">Not started</span>
              )}
            </div>
            
            <div className="sm:col-span-2 pt-3 border-t border-slate-100">
  <p className="text-xs text-slate-500 mb-1.5">Remarks</p>
  {project.remarks?.trim() ? (
    <p className="text-sm text-slate-700">{project.remarks}</p>
  ) : (
    <p className="text-sm text-slate-400 italic">No remarks added</p>
  )}
</div>

            <div className="sm:col-span-2 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Last Updated</p>
              <p className="text-sm text-slate-700">
                {project.updatedAt ? format(new Date(project.updatedAt), "dd MMM yyyy — HH:mm") : "—"}
              </p>
            </div>
          </div>
        </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-5">
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
                <div className="pb-6">
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
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
