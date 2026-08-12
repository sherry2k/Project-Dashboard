export interface Project {
  id: number;
  ownerName: string;
  projectNo: string;
  plotNo: string;
  projectLocation: string;
  noc: string;
  perspective3d: string;
  architecture: string;
  structure: string;
  status: string;
  contractor: string;
  remarks: string;
  archived: number;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: string;
  fieldEditors?: Record<string, string>;
  soilReportRequestedDate?: string | null;
  soilReportExpectedDate?: string | null;
  soilReportActualDate?: string | null;
  soilReportLab?: string | null;
  soilReportRequired?: string;
  siteProgressPercent?: number;
}
export interface ProjectStats {
  total: number;
  active: number;
  permitIssued: number;
  waitingOwner: number;
  soilReportOverdue: number;
  waitingTender: number;
  waitingPayment: number;
  projectCancelled: number;
  completed: number;
  inProgress: number;
}

export interface AuditLog {
  id: number;
  projectId: number;
  field: string;
  oldValue: string;
  newValue: string;
  editedBy: string;
  createdAt: string;
}

/** A single modification made by any user, surfaced in the header bell */
export interface NotificationItem {
  id: number;
  projectId: number;
  projectNo: string;
  ownerName: string;
  field: string;
  oldValue: string;
  newValue: string;
  editedBy: string;
  createdAt: string;
  /** true when the change was made by somebody other than the current user */
  byOther: boolean;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  serverTime: string;
}

/** Which stat card is currently driving the project list */
export type StatFilterType = "none" | "status" | "noc" | "active" | "dataQuality" | "soilOverdue";

export interface StatFilter {
  type: StatFilterType;
  value: string;
}
