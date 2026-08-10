export const PROJECT_LOCATIONS = [
  "Abu Dhabi", "Madinat Al Riyad", "Al Falah", "Khalidiyah", "Yas Island",
  "Mushrif", "Saadiyat Island", "Jubail Island", "Mohammed Bin Zayed City",
  "Khalifa City", "Al Reef", "Al Raha", "Al Shamkhah", "Al Samhah",
  "Masdar City", "Shakhbout City", "Al Bahyah", "Al Shawamekh",
  "Al Reem Island", "Zayed City", "Al Ain", "Liwa", "Beda Zayed-Al Dhafra",
] as const;

export const NOC_OPTIONS = [
  "Done", "Not Required", "Pending", "Submitted", "Waiting Payment", "Rejected",
] as const;
export const PERSPECTIVE_3D_OPTIONS = ["Ready", "Not Required", "In Progress", "Pending"] as const;
export const ARCHITECTURE_OPTIONS = ["Approved", "Ready", "Comments", "Submitted", "Pending", "In Progress"] as const;
export const STRUCTURE_OPTIONS = ["Approved", "Ready", "Comments", "Submitted", "Pending", "Not Required", "In Progress"] as const;
export const STATUS_OPTIONS = [
  "Pending", "Permit Issued", "Waiting Owner", "Waiting Soil Report",
  "Soil Report Ready", "Waiting Tender", "In Progress", "Project Cancelled",
  "Completed", "On Hold",
] as const;

// Only used for the top-level project Status column — this is the one
// "Pending" that should visually shout, since it's the whole-project flag.
const STATUS_PENDING_STYLE = { bg: "bg-amber-300", text: "text-amber-950 font-semibold" };

// Shared alert style for genuinely urgent/blocking sub-states (used sparingly,
// cross-column, so it doesn't get diluted)
const ALERT_STYLE = { bg: "bg-red-500", text: "text-white font-medium" };
const COMMENTS_STYLE = { bg: "bg-amber-100", text: "text-amber-800" };

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Pending": { ...STATUS_PENDING_STYLE, dot: "bg-amber-700"  },
  "Permit Issued": { bg: "bg-emerald-600", text: "text-white", dot: "bg-green-500" },
  "Waiting Owner": { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  "Waiting Soil Report": { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  "Soil Report Ready": { bg: "bg-teal-100", text: "text-teal-800", dot: "bg-teal-500" },
  "Waiting Tender": { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
  "In Progress": { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  "Project Cancelled": { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  "Completed": { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
  "On Hold": { bg: "bg-slate-100", text: "text-slate-800", dot: "bg-slate-500" },
};

// NOC — blue family
export const NOC_COLORS: Record<string, { bg: string; text: string }> = {
  "Done": { bg: "bg-blue-600", text: "text-white font-medium" },
  "Not Required": { bg: "bg-gray-100", text: "text-gray-500" },
  "Pending": { bg: "bg-blue-50", text: "text-blue-900 font-semibold border border-blue-300" },
  "Waiting": { bg: "bg-blue-100", text: "text-blue-800" },
  "Waiting Payment": ALERT_STYLE,
  "Rejected": { bg: "bg-red-100", text: "text-red-800" },
  "Submitted": { bg: "bg-blue-200", text: "text-blue-900 font-medium" },
};

// 3D Perspective — teal family
export const PERSPECTIVE_COLORS: Record<string, { bg: string; text: string }> = {
  "Ready": { bg: "bg-teal-600", text: "text-white font-medium" },
  "Not Required": { bg: "bg-gray-100", text: "text-gray-500" },
  "In Progress": { bg: "bg-teal-100", text: "text-teal-800" },
  "Pending": { bg: "bg-teal-50", text: "text-teal-900 font-semibold border border-teal-300" },
};

// Architecture — indigo family
export const ARCH_COLORS: Record<string, { bg: string; text: string }> = {
  "Approved": { bg: "bg-indigo-600", text: "text-white font-medium" },
  "Ready": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "Comments": COMMENTS_STYLE,
  "Pending": { bg: "bg-indigo-50", text: "text-indigo-900 font-semibold border border-indigo-300" },
  "In Progress": { bg: "bg-indigo-200", text: "text-indigo-900" },
  "Submitted": { bg: "bg-indigo-300", text: "text-indigo-900 font-medium" },
};

// Structure — violet family
export const STRUCT_COLORS: Record<string, { bg: string; text: string }> = {
  "Approved": { bg: "bg-violet-600", text: "text-white font-medium" },
  "In Progress": { bg: "bg-violet-100", text: "text-violet-800" },
  "Not Required": { bg: "bg-gray-100", text: "text-gray-500" },
  "Comments": COMMENTS_STYLE,
  "Pending": { bg: "bg-violet-50", text: "text-violet-900 font-semibold border border-violet-300" },
  "Submitted": { bg: "bg-violet-300", text: "text-violet-900 font-medium" },
};
