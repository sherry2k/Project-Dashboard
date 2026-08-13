import type { Project } from "@/lib/types";

export function getCurrentActivity(project: Project): { icon: string; label: string } {
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
if (["In Progress", "Pending"].includes(project.perspective3d)) return { icon: "🎨", label: "3D Perspective" };
if (["In Progress", "Pending", "Comments", "Ready"].includes(project.architecture)) return { icon: "📐", label: "Architecture" };
if (["In Progress", "Pending", "Comments"].includes(project.structure)) return { icon: "🏗", label: "Structure" };
return { icon: "📌", label: project.status };
}

export function getWaitingFor(project: Project): { icon: string; label: string } | null {
  if (project.soilReportRequestedDate && project.soilReportExpectedDate && !project.soilReportActualDate) {
    return { icon: "🧪", label: "Soil Report" };
  }
  if (["Pending", "Waiting", "Submitted"].includes(project.noc)) return { icon: "🏛", label: "Municipality Approval" };
  if (project.status === "Waiting Owner") return { icon: "👤", label: "Owner" };
  if (project.status === "Waiting Tender") return { icon: "📋", label: "Tender" };
  if (project.noc === "Waiting Payment") return { icon: "💰", label: "Payment" };
  return null;
}

export type SoilStatus = "Not Required" | "Not Started" | "Requested" | "In Progress" | "Report Received" | "Overdue";

export function getSoilInvestigationStatus(project: Project): {
  status: SoilStatus;
  detail?: string;
  percent: number | null;
  color: string;
  badgeColor: string;
} {
  if (project.soilReportRequired === "Not Required") {
    return { status: "Not Required", percent: null, color: "bg-slate-300", badgeColor: "bg-slate-200 text-slate-700" };
  }

  const requested = project.soilReportRequestedDate ? new Date(project.soilReportRequestedDate) : null;
  const expected = project.soilReportExpectedDate ? new Date(project.soilReportExpectedDate) : null;
  const actual = project.soilReportActualDate ? new Date(project.soilReportActualDate) : null;
  const now = new Date();

  if (actual && actual.getTime() <= now.getTime()) {
    const daysTaken = requested ? Math.round((actual.getTime() - requested.getTime()) / 86400000) : null;
    return {
      status: "Report Received",
      detail: daysTaken !== null ? `Took ${daysTaken} days` : undefined,
      percent: 100,
      color: "bg-emerald-500",
      badgeColor: "bg-emerald-100 text-emerald-800",
    };
  }

  if (!requested) {
    return { status: "Not Started", percent: null, color: "bg-slate-300", badgeColor: "bg-slate-100 text-slate-500" };
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

export type WorkflowState = "done" | "active" | "pending";

export interface WorkflowStep {
  label: string;
  state: WorkflowState;
  detail?: string;
}

export function getWorkflowSteps(project: Project): WorkflowStep[] {
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
    ["Completed", "Permit Issued"].includes(project.status) || !!project.contractor?.trim() ? "done"
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

export function getConsultancyProgress(project: Project): number {
  const steps = getWorkflowSteps(project);
  const relevant = steps.filter((s) => s.label !== "Contractor Assignment");

  // "Not Required" fields are excluded from both numerator and denominator,
  // since they were never applicable to this project in the first place.
  const applicable = relevant.filter((s) => {
    if (s.label === "Municipality (NOC)") return project.noc !== "Not Required";
    if (s.label === "3D Perspective") return project.perspective3d !== "Not Required";
    return true;
  });

  if (applicable.length === 0) return 100;

  const doneCount = applicable.filter((s) => s.state === "done").length;
  return Math.round((doneCount / applicable.length) * 100);
}
