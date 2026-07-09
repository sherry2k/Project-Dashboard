export const PROJECT_LOCATIONS = [
  "Abu Dhabi",
  "Madinat Al Riyad",
  "Al Falah",
  "Khalidiyah",
  "Yas Island",
  "Saadiyat Island",
  "Jubail Island",
  "Mohammed Bin Zayed City",
  "Khalifa City",
  "Al Reef",
  "Al Raha",
  "Al Shamkha",
  "Masdar City",
  "Al Reem Island",
  "Al Shawamekh",
  "Zayed City",
  "Al Ain",
  "Beda Zayed-Al Dhafra",
] as const;

export const NOC_OPTIONS = [
  "Done",
  "Not Required",
  "Pending",
  "Waiting",
  "Rejected",
] as const;

export const PERSPECTIVE_3D_OPTIONS = [
  "Ready",
  "Not Required",
  "In Progress",
  "Pending",
] as const;

export const ARCHITECTURE_OPTIONS = [
  "Approved",
  "Ready",
  "Comments",
  "Pending",
  "In Progress",
] as const;

export const STRUCTURE_OPTIONS = [
  "Approved",
  "In Progress",
  "Comments",
  "Pending",
] as const;

export const STATUS_OPTIONS = [
  "Permit Issued",
  "Waiting Owner",
  "Waiting Soil Report",
  "Soil Report Ready",
  "Waiting Tender",
  "In Progress",
  "Project Cancelled",
  "Completed",
  "On Hold",
] as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Permit Issued": { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  "Waiting Owner": { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  "Waiting Soil Report": { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  "Soil Report Ready": { bg: "bg-teal-100", text: "text-teal-800", dot: "bg-teal-500" },
  "Waiting Tender": { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
  "In Progress": { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  "Project Cancelled": { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  "Completed": { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
  "On Hold": { bg: "bg-slate-100", text: "text-slate-800", dot: "bg-slate-500" },
};

export const NOC_COLORS: Record<string, { bg: string; text: string }> = {
  "Done": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Not Required": { bg: "bg-gray-100", text: "text-gray-600" },
  "Pending": { bg: "bg-amber-100", text: "text-amber-800" },
  "Waiting": { bg: "bg-orange-100", text: "text-orange-800" },
  "Rejected": { bg: "bg-red-100", text: "text-red-800" },
};

export const ARCH_COLORS: Record<string, { bg: string; text: string }> = {
  "Approved": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Ready": { bg: "bg-blue-100", text: "text-blue-800" },
  "Comments": { bg: "bg-amber-100", text: "text-amber-800" },
  "Pending": { bg: "bg-orange-100", text: "text-orange-800" },
  "In Progress": { bg: "bg-purple-100", text: "text-purple-800" },
};

export const STRUCT_COLORS: Record<string, { bg: string; text: string }> = {
  "Approved": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "In Progress": { bg: "bg-blue-100", text: "text-blue-800" },
  "Comments": { bg: "bg-amber-100", text: "text-amber-800" },
  "Pending": { bg: "bg-orange-100", text: "text-orange-800" },
};

export const PERSPECTIVE_COLORS: Record<string, { bg: string; text: string }> = {
  "Ready": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Not Required": { bg: "bg-gray-100", text: "text-gray-600" },
  "In Progress": { bg: "bg-blue-100", text: "text-blue-800" },
  "Pending": { bg: "bg-amber-100", text: "text-amber-800" },
};
