"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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
      <div className="bg-gradient-to-r from-[#5E9E3A] to-[#4a8230] px-6 py-5">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-3 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <p className="text-green-100 text-xs uppercase tracking-wider font-semibold mb-1">Project Overview</p>
        <h1 className="text-2xl font-bold text-white">{project.projectNo}</h1>
        <p className="text-green-100 text-sm mt-1">{project.ownerName}</p>
        <p className="text-green-200 text-xs mt-0.5">Plot {project.plotNo} — {project.projectLocation}</p>
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
              <p className="text-xs text-slate-500 mb-1">Last Updated</p>
              <p className="text-sm text-slate-700">
                {project.updatedAt ? format(new Date(project.updatedAt), "dd MMM yyyy — HH:mm") : "—"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
