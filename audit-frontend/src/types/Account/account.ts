export interface AccountInfo {
  strAccountGUID: string;
  strAccountName: string;
  strAccountTypeGUID: string;
  strAccountTypeName: string;
  strDesc?: string | null;
  bolIsActive: boolean;
}

export interface ScheduleTreeNode {
  strScheduleGUID: string;
  strScheduleName: string;
  strScheduleCode: string;
  strParentScheduleGUID?: string | null;
  level: number;
  accounts: AccountInfo[];
  children: ScheduleTreeNode[];
}

export interface AccountWithScheduleTreeResponse {
  scheduleTree: ScheduleTreeNode[];
}

export interface ScheduleNode {
  strScheduleGUID: string;
  strScheduleName: string;
  strScheduleCode: string;
  strParentScheduleGUID?: string | null;
  level: number; // 0 = current schedule, 1 = parent, 2 = grandparent, etc.
}

export interface AccountWithScheduleTree {
  strGeneralAccountGUID: string;
  strGeneralAccountName: string;
  strAccountTypeGUID: string;
  strAccountTypeName: string;
  strScheduleGUID: string;
  strDesc?: string | null;
  bolIsActive: boolean;
  scheduleHierarchy: ScheduleNode[];
}

export interface AccountsByTypesTreeParams {
  strAccountTypeGUIDs?: string; // Optional: comma-separated account type GUIDs to EXCLUDE
  maxLevel?: number | null; // Optional: Maximum level depth (0=root only, 1=root+children, null=all levels)
}
