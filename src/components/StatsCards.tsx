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
  CreditCard,
  Gavel,
} from "lucide-react";
import type { ProjectStats } from "@/lib/types";

interface StatsCardsProps {
  stats: ProjectStats;
  onFilter: (status: string, isNocFilter?: boolean) => void;
  activeFilter: string;
  activeNocFilter?: string;
}

const cards = [
  { key: "total", label: "Total Projects", icon: FolderKanban, color: "from-[#5E9E3A] to-[#4a8230]", filterVal: "__clear__", isNocFilter: false },
  { key: "active", label: "Active Projects", icon: Activity, color: "from-blue-500 to-blue-600", filterVal: "__clear__", isNocFilter: false },
  { key: "permitIssued", label: "Permit Issued", icon: CheckCircle2, color: "from-emerald-500 to-emerald-600", filterVal: "Permit Issued", isNocFilter: false },
  { key: "waitingOwner", label: "Waiting Owner", icon: Clock, color: "from-amber-500 to-amber-600", filterVal: "Waiting Owner", isNocFilter: false },
  { key: "waitingSoilReport", label: "Waiting Soil Report", icon: FileWarning, color: "from-orange-500 to-orange-600", filterVal: "Waiting Soil Report", isNocFilter: false },
  { key: "waitingTender", label: "Waiting Tender", icon: Gavel, color: "from-indigo-500 to-indigo-600", filterVal: "Waiting Tender", isNocFilter: false },
  { key: "waitingPayment", label: "Waiting Payment", icon: CreditCard, color: "from-red-600 to-red-700", filterVal: "Waiting Payment", isNocFilter: true },
  { key: "projectCancelled", label: "Cancelled", icon: XCircle, color: "from-red-500 to-red-600", filterVal: "Project Cancelled", isNocFilter: false },
  { key: "completed", label: "Completed", icon: Award, color: "from-slate-500 to-slate-600", filterVal: "Completed", isNocFilter: false },
  { key: "inProgress", label: "In Progress", icon: Loader2, color: "from-purple-500 to-purple-600", filterVal: "In Progress", isNocFilter: false },
] as const;

export default function StatsCards({ stats, onFilter, activeFilter, activeNocFilter }: StatsCardsProps) {
  return (
    <div className="sticky top-16 z-40 bg-[#F1F5F9] pt-3 pb-3 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-slate-200 shadow-sm no-print">
      <div className="flex gap-2.5 overflow-x-auto lg:grid lg:grid-cols-10 lg:overflow-visible pb-1 lg:pb-0">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof ProjectStats];
          const isClearCard = card.filterVal === "__clear__";
          const isActive = card.isNocFilter
            ? activeNocFilter === card.filterVal
            : isClearCard
              ? !activeFilter && !activeNocFilter
              : activeFilter === card.filterVal;

          return (
            <button
              key={card.key}
              onClick={() => onFilter(isClearCard ? "" : card.filterVal, card.isNocFilter)}
              className={`relative shrink-0 w-[132px] lg:w-auto bg-white rounded-xl px-3 py-2.5 shadow-sm border transition-all hover:shadow-md text-left ${
                isActive ? "ring-2 ring-[#5E9E3A] border-[#5E9E3A]" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
                  <Icon size={16} className="text-white" />
                </div>
                <p className={`text-xl font-bold leading-none ${card.isNocFilter && value > 0 ? "text-red-600" : "text-slate-800"}`}>
                  {value}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-tight truncate">{card.label}</p>
              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5E9E3A]"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
