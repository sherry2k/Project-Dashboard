"use client";

import {
  FolderKanban,
  Activity,
  CheckCircle2,
  Clock,
  FileWarning,
  XCircle,
  Award,
  Loader2,
} from "lucide-react";
import type { ProjectStats } from "@/lib/types";

interface StatsCardsProps {
  stats: ProjectStats;
  onFilter: (status: string) => void;
  activeFilter: string;
}

const cards = [
  { key: "total", label: "Total Projects", icon: FolderKanban, color: "from-navy to-steel", filterVal: "" },
  { key: "active", label: "Active Projects", icon: Activity, color: "from-blue-500 to-blue-600", filterVal: "" },
  { key: "permitIssued", label: "Permit Issued", icon: CheckCircle2, color: "from-emerald-500 to-emerald-600", filterVal: "Permit Issued" },
  { key: "waitingOwner", label: "Waiting Owner", icon: Clock, color: "from-amber-500 to-amber-600", filterVal: "Waiting Owner" },
  { key: "waitingSoilReport", label: "Waiting Soil Report", icon: FileWarning, color: "from-orange-500 to-orange-600", filterVal: "Waiting Soil Report" },
  { key: "projectCancelled", label: "Cancelled", icon: XCircle, color: "from-red-500 to-red-600", filterVal: "Project Cancelled" },
  { key: "completed", label: "Completed", icon: Award, color: "from-slate-500 to-slate-600", filterVal: "Completed" },
  { key: "inProgress", label: "In Progress", icon: Loader2, color: "from-purple-500 to-purple-600", filterVal: "In Progress" },
] as const;

export default function StatsCards({ stats, onFilter, activeFilter }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key as keyof ProjectStats];
        const isActive = card.filterVal && activeFilter === card.filterVal;

        return (
          <button
            key={card.key}
            onClick={() => card.filterVal && onFilter(card.filterVal)}
            className={`relative bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 text-left group ${
              isActive ? "ring-2 ring-accent border-accent" : "border-slate-200"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-2 shadow-sm`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{card.label}</p>
            {isActive && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}
