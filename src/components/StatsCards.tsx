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
import type { ProjectStats, StatFilterType } from "@/lib/types";

interface StatsCardsProps {
  stats: ProjectStats;
  /** type tells the dashboard how to filter: none = show all */
  onFilter: (type: StatFilterType, value: string) => void;
  /** currently applied stat filter */
  activeType: StatFilterType;
  activeValue: string;
  needsInfoCount: number;
}

const cards = [
  { key: "total", label: "Total Projects", icon: FolderKanban, color: "from-[#5E9E3A] to-[#4a8230]", type: "none", value: "" },
  { key: "active", label: "Active Projects", icon: Activity, color: "from-blue-500 to-blue-600", type: "active", value: "active" },
  { key: "permitIssued", label: "Permit Issued", icon: CheckCircle2, color: "from-emerald-500 to-emerald-600", type: "status", value: "Permit Issued" },
  { key: "waitingOwner", label: "Waiting Owner", icon: Clock, color: "from-amber-500 to-amber-600", type: "status", value: "Waiting Owner" },
  { key: "waitingSoilReport", label: "Waiting Soil Report", icon: FileWarning, color: "from-orange-500 to-orange-600", type: "status", value: "Waiting Soil Report" },
  { key: "waitingTender", label: "Waiting Tender", icon: Gavel, color: "from-indigo-500 to-indigo-600", type: "status", value: "Waiting Tender" },
  { key: "waitingPayment", label: "Waiting Payment", icon: CreditCard, color: "from-red-600 to-red-700", type: "noc", value: "Waiting Payment" },
  { key: "projectCancelled", label: "Cancelled", icon: XCircle, color: "from-red-500 to-red-600", type: "status", value: "Project Cancelled" },
  { key: "completed", label: "Completed", icon: Award, color: "from-slate-500 to-slate-600", type: "status", value: "Completed" },
  { key: "inProgress", label: "In Progress", icon: Loader2, color: "from-purple-500 to-purple-600", type: "status", value: "In Progress" },
] as const;


// Change grid to 11 columns, or keep 10 and let it wrap on the flex/scroll row
// (flex row already scrolls horizontally on smaller screens, so this is safe)

export default function StatsCards({ stats, onFilter, activeType, activeValue, needsInfoCount }: StatsCardsProps) {
  const totalCards = cards.length + (needsInfoCount > 0 ? 1 : 0);
  return (
    <div className="sticky top-16 z-40 bg-[#F1F5F9] pt-3 pb-3 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-slate-200 shadow-sm no-print">
      <div
  className="flex gap-2.5 overflow-x-auto lg:grid lg:overflow-visible pb-1 lg:pb-0"
  style={{ gridTemplateColumns: `repeat(${totalCards}, minmax(0, 1fr))` }}
>
        {cards.map((card) => {
  const Icon = card.icon;
  const value = stats[card.key as keyof ProjectStats];
  const isTotalCard = card.type === "none";
  const isActive = isTotalCard
    ? activeType === "none"
    : activeType === card.type && activeValue === card.value;

  return (
    <button
      key={card.key}
      onClick={() => {
        if (isActive && !isTotalCard) {
          onFilter("none", "");
        } else {
          onFilter(card.type as StatFilterType, card.value);
        }
      }}
      title={`Show ${card.label.toLowerCase()} (${value})`}
      className={`relative shrink-0 w-[132px] lg:w-auto bg-white rounded-xl px-3 py-2.5 shadow-sm border transition-all hover:shadow-md text-left ${
        isActive ? "ring-2 ring-[#5E9E3A] border-[#5E9E3A]" : "border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
          <Icon size={16} className="text-white" />
        </div>
        <p className={`text-xl font-bold leading-none ${card.type === "noc" && value > 0 ? "text-red-600" : "text-slate-800"}`}>
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

        {needsInfoCount > 0 && (
          <button
            onClick={() => onFilter("dataQuality" as StatFilterType, "needsInfo")}
            title={`${needsInfoCount} projects missing contractor or remarks`}
            className={`relative shrink-0 w-[132px] lg:w-auto bg-white rounded-xl px-3 py-2.5 shadow-sm border-2 border-dashed transition-all hover:shadow-md text-left ${
              activeType === "dataQuality"
                ? "ring-2 ring-sky-500 border-sky-500"
                : "border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center shadow-sm">
                <FileWarning size={16} className="text-white" />
              </div>
              <p className="text-xl font-bold leading-none text-sky-700">{needsInfoCount}</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-tight truncate">Needs Info</p>
            {activeType === "dataQuality" && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500"></div>
            )}
    </button>
  );
})}
      </div>
    </div>
  );
}

