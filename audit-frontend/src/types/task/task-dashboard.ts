import type { ApiResponse, BaseListParams } from "@/types";

export type TaskStatus =
  | "Open"
  | "In Progress"
  | "Completed"
  | "Closed"
  | "Cancelled";

export type BoardStatusType =
  | "Not Started"
  | "Started"
  | "For Review"
  | "Completed"
  | "On-Hold"
  | "InComplete";

export interface UserStatusCount {
  strStatus: string;
  intCount: number;
}

export interface DashboardStatusParams extends BaseListParams {
  status?: string;
  dtDate?: string;
}

export interface UserTaskInfo {
  strTaskGUID: string;
  strTaskTitle: string;
  strDescription: string;
  strPriority: string;
  strStatus: string;
  bolIsPrivate: boolean;
  strTags: string;
  strBoardName: string;
  strBoardSection: string;
  strColor: string;
  dtStartTime: string;
  dtDueDate: string | null;
  intEstimatedMinutes: number | null;
  strEstimatedTimeHMS: string;
  intActualMinutes: number;
  strActualTimeHMS: string;
  strTimerDescription: string;
  strTaskBoardGUID?: string;
  bolIsFromDifferentBoard?: boolean;
}

export interface UserStatus {
  strUserGUID: string;
  strUserName: string;
  strUserStatus: "Active" | "Idle";
  dtWorkingStartTime: string | null;
  dtWorkingEndTime: string | null;
  strProfileImg: string | null;
  strDepartmentGUID: string | null;
  strDesignationGUID: string | null;
  taskInfo: UserTaskInfo | null;
  strWorkingMessage?: string | null;
}

export interface UserStatusParams {
  strBoardGUID: string;
  strUserGUID: string;
  strUserStatus?: "Active" | "Idle";
  strPriority?: string;
  strDepartmentGUID?: string;
  strDesignationGUID?: string;
}

export interface BoardStatusCount {
  strStatus: BoardStatusType;
  intCount: number;
}

export interface BoardStatusParams {
  strBoardGUID: string;
}

export type DashboardStatusUserResponse = ApiResponse<UserStatusCount[]>;
export type DashboardUserStatusResponse = ApiResponse<UserStatus[]>;
export type DashboardBoardStatusResponse = ApiResponse<BoardStatusCount[]>;
