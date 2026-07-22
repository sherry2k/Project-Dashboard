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
}

export interface ProjectStats {
  total: number;
  active: number;
  permitIssued: number;
  waitingOwner: number;
  waitingSoilReport: number;
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
