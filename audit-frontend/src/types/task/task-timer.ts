import type { ApiPagedResponse, BaseListParams } from "@/types";
import type { TaskActivity } from "@/types/task/task";

export interface TaskTimer {
  strTaskTimerGUID: string;
  strTaskGUID: string;
  strBoardName: string;
  strTitle: string;
  strTaskDescription: string;
  strStatus: string;
  strPriority: string;
  dtStartDate: string | null;
  dtDueDate: string | null;
  dtCompletedDate: string | null;
  dtReminderDate: string | null;
  intEstimatedMinutes: number | null;
  strTags: string;
  bolIsPrivate: boolean;
  dtStartTime: string;
  dtEndTime: string | null;
  intTotalMinutes: number | null;
  strTimerDescription: string;
}

export interface TaskTimerWithUsers {
  strTaskTimerGUID: string;
  strTaskGUID: string;
  strBoardName: string;
  strTitle: string;
  strTaskDescription: string;
  strStatus: string;
  strPriority: string;
  intPercentage: number;
  strAssignedToGUID: string | null;
  dtStartDate: string | null;
  dtDueDate: string | null;
  dtCompletedDate: string | null;
  dtReminderDate: string | null;
  intEstimatedMinutes: number | null;
  intActualMinutes: number | null;
  strTags: string;
  bolIsPrivate: boolean;
  strUserGUID: string;
  strUserName: string;
  dtStartTime: string;
  dtEndTime: string | null;
  intTotalMinutes: number | null;
  strTimerDescription: string;
  dtCreatedOn: string;
  strCreatedByGUID: string;
  strCreatedByName: string;
  dtUpdatedOn: string | null;
  strUpdatedByGUID: string | null;
  strUpdatedByName: string | null;
}

export interface TaskTimerFilterParams extends BaseListParams {
  dtStartTime?: string;
  bolIsActive?: boolean;
}

export interface StartTimerRequest {
  strTaskGUID: string;
}

export interface StartTimerResponse {
  timer: TaskTimer;
  strTotalTimeWorked: string;
}

export interface PauseTimerRequest {
  strTaskGUID: string;
  strUserGUID: string;
  strHoldReason: string;
}

export interface TimerActionRequest {
  strTaskGUID: string;
  strUserGUID: string;
  strIncompleteReason?: string;
}

export interface ActiveSessionResponse {
  strTotalTimeWorked: string;
  strTaskGUID?: string;
  strTaskNo?: number;
  strBoardName?: string | null;
  strBoardSectionName?: string | null;
  strBoardSubModuleGUID?: string | null;
  strBoardSubModuleName?: string | null;
  strTitle?: string | null;
  strTicketKey?: string | null;
  strTicketUrl?: string | null;
  strTicketSource?: string | null;
  strDescription?: string | null;
  strStatus?: string | null;
  strPriority?: string | null;
  dtStartDate?: string | null;
  dtDueDate?: string | null;
  strTags?: string | null;
  bolIsPrivate?: boolean | null;
  bolIsReviewed?: boolean | null;
  strAssignedByGUID?: string | null;
  strAssignedBy?: string | null;
}

export type TaskTimerListResponse = ApiPagedResponse<TaskTimer>;

export interface TaskTimelineResponseDto {
  strTaskNo: string;
  strTaskTitle: string;
  strDescription: string;
  strPriority: string;
  strStatus: string;
  bolIsPrivate: boolean;
  strTags: string;
  strUserName: string | null;
  strBoardName: string | null;
  strBoardSection: string | null;
  strBoardSubModuleGUID?: string | null;
  strBoardSubModuleName?: string | null;
  strColor: string | null;
  dtDate: string;
  dtStartTime: string;
  dtEndTime: string | null;
  dtDueDate: string | null;
  strEstimatedTime: string | null;
  strActualTime: string | null;
  strTimerDescription: string | null;
  bolIsBillable: boolean;
  strTicketKey?: string | null;
  strTicketUrl?: string | null;
  strTicketSource?: string | null;
}

export interface TaskTimelineFilterDto extends BaseListParams {
  dtFromDate?: string;
  dtToDate?: string;
}

export interface TaskTimelineByUserParams extends BaseListParams {
  strUserGUID?: string;
  strBoardGUID?: string;
  dtFromDate?: string;
  dtToDate?: string;
}

export interface TaskTimelineResponse {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: TaskTimelineResponseDto[];
  errors: string[] | null;
  message: string;
  statusCode: number;
}

export interface TaskActivityResponse {
  activity: TaskActivity[];
}
