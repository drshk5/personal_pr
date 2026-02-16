import type {
  ApiResponse,
  BackendPagedResponse,
  BaseListParams,
} from "@/types";
import type { TaskChecklist } from "./checklist";
import type { ReviewTask } from "./review-task";

export interface TaskFile {
  strDocumentGUID: string;
  strDocumentAssociationGUID: string;
  strFileName: string;
  strFileType: string | null;
  strFileSize: string | null;
  strFilePath: string | null;
}

export interface TaskActivity {
  dtStartTime: string;
  dtEndTime: string | null;
  strStatus: string | null;
  strDescription: string | null;
  strActualTime: string;
}

export interface TaskRecurrence {
  strRecurrenceType: "Daily" | "Weekly" | "Monthly" | "Yearly";
  intRecurrenceInterval: number;
  strDaysOfWeek?: string[] | null;
  intDayOfMonth?: number | null;
  strWeekPattern?:
    | "First"
    | "Second"
    | "Third"
    | "Fourth"
    | "Fifth"
    | "Last"
    | null;
  strWeekDay?: string | null;
  intMonthOfYear?: number | null;
  dtStartDate: string;
  dtEndDate?: string | null;
  bolNoEndDate: boolean;
}

export interface TaskListItem {
  strTaskGUID: string;
  strTaskNo?: number;
  strBoardGUID?: string | null;
  strBoardName?: string | null;
  strBoardSectionGUID?: string | null;
  strBoardSectionName?: string | null;
  strSubModuleGUID?: string | null;
  strSubModuleName?: string | null;
  strBoardSubModuleGUID?: string | null;
  strOrganizationGUID?: string;
  strYearGUID?: string;
  strTitle: string;
  strTicketKey?: string | null;
  strTicketUrl?: string | null;
  strTicketSource?: string | null;
  strDescription?: string | null;
  strStatus: string;
  strPriority: string;
  strCompletionRule?: "ANY_ONE" | "ALL_USERS";
  intPercentage?: number;
  strAssignedToGUID?: string | null;
  dtStartDate?: string | null;
  dtDueDate?: string | null;
  dtCompletedDate?: string | null;
  dtReminderDate?: string | null;
  strReminderTo?: string | null;
  intEstimatedMinutes?: number | null;
  intActualMinutes?: number | null;
  strActualMinutes?: string | null;
  strTags?: string | null;
  bolIsPrivate?: boolean;
  bolIsReviewReq?: boolean;
  bolIsBillable?: boolean;
  bolIsNotificationSend?: boolean;
  strReviewedByGUID?: string | null;
  strReviewedBy?: string | null;
  bolIsTimeTrackingReq?: boolean;
  strAssignedByGUID?: string | null;
  strAssignedTo?: string | null;
  strAssignedBy?: string | null;
  assignments?: AssignTaskAssignment[];
  strCreatedByGUID?: string | null;
  dtCreatedOn?: string;
  strUpdatedByGUID?: string | null;
  dtUpdatedOn?: string | null;
  recurrence?: TaskRecurrence | null;
  strFiles?: TaskFile[];
  strChecklists?: TaskChecklist[];
  activity?: TaskActivity[];
  strTotalTime?: string | null;
  reviews?: ReviewTask[];
  intChecklistsCount?: number;
  intFilesCount?: number;
  intActivitiesCount?: number;
  intReviewsCount?: number;
}

export interface MyTaskListItem extends TaskListItem {
  strMyCompletionStatus?: string | null;
  intChecklistsCount: number;
  intFilesCount: number;
  intActivitiesCount: number;
  intReviewsCount: number;
}

export interface AssignTaskAssignment {
  strAssignToGUID: string;
  strAssignToType: string;
  strAssignToName?: string | null;
}

export interface AssignedByMeTaskListItem {
  strTaskGUID: string;
  strTaskNo: number;
  strBoardGUID?: string | null;
  strBoardName?: string | null;
  strBoardSectionGUID?: string | null;
  strBoardSectionName?: string | null;
  strSubModuleGUID?: string | null;
  strSubModuleName?: string | null;
  strOrganizationGUID: string;
  strYearGUID: string;
  strTitle: string;
  strTicketKey?: string | null;
  strTicketSource?: string | null;
  strDescription: string;
  strStatus: string;
  strPriority: string;
  strCompletionRule?: string | null;
  intPercentage: number;
  strAssignedByGUID?: string | null;
  strAssignedBy?: string | null;
  assignments: AssignTaskAssignment[];
  dtStartDate?: string | null;
  dtDueDate?: string | null;
  dtCompletedDate?: string | null;
  intEstimatedMinutes?: number | null;
  intActualMinutes?: number | null;
  strActualMinutes?: string | null;
  strTotalTime?: string | null;
  strTags: string;
  intChecklistsCount: number;
  intFilesCount: number;
  intActivitiesCount: number;
  intReviewsCount: number;
}

export interface Task {
  strTaskGUID: string;
  strTaskNo: number;
  strBoardGUID: string | null;
  strBoardName?: string | null;
  strBoardSubModuleGUID?: string | null;
  strBoardSectionGUID: string | null;
  strBoardSectionName?: string | null;
  strOrganizationGUID: string;
  strYearGUID: string;
  strTitle: string;
  strTicketKey: string | null;
  strTicketUrl: string | null;
  strTicketSource: string | null;
  strDescription: string;
  strStatus: string;
  strPriority: string;
  strParentTaskRecurrenceGUID?: string | null;
  strCompletionRule?: "ANY_ONE" | "ALL_USERS";
  intPercentage: number;
  strAssignedToGUID?: string | null;
  dtStartDate: string | null;
  dtDueDate: string | null;
  dtCompletedDate: string | null;
  dtReminderDate: string | null;
  strReminderTo: string | null;
  intEstimatedMinutes: number | null;
  intActualMinutes: number | null;
  strActualMinutes?: string | null;
  strTags: string;
  bolIsPrivate: boolean;
  bolIsReviewReq: boolean;
  bolIsBillable: boolean;
  bolIsNotificationSend: boolean;
  strReviewedByGUID: string | null;
  strReviewedBy: string | null;
  bolIsTimeTrackingReq: boolean;
  strAssignedByGUID?: string | null;
  strAssignedTo?: string | null;
  strAssignedBy?: string | null;
  strCreatedByGUID: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID: string | null;
  dtUpdatedOn: string | null;
  recurrence?: TaskRecurrence | null;
  assignments?: AssignTaskAssignment[];
  strFiles?: TaskFile[];
  strChecklists?: TaskChecklist[];
  activity?: TaskActivity[];
  strTotalTime?: string | null;
  reviews?: ReviewTask[];
  strMyCompletionStatus?: string | null;
}

export interface TaskSimple {
  strTaskGUID: string;
  strTitle: string;
}

export interface TaskParams extends BaseListParams {
  strBoardGUID?: string;
  strBoardGUIDs?: string | string[];
  strBoardSectionGUID?: string;
  strBoardSectionGUIDs?: string | string[];
  strStatus?: string;
  strStatuses?: string | string[];
  strPriority?: string;
  strPriorities?: string | string[];
  strAssignedToGUID?: string | null;
  strAssignedToGUIDs?: string | string[];
  strAssignedByGUID?: string | null;
  strAssignedByGUIDs?: string | string[];
  strReviewedByGUID?: string | null;
  strReviewedByGUIDs?: string | string[];
  bolIsPrivate?: boolean;
  bolIsBillable?: boolean;
  bolIsRecurring?: boolean;
  bolIsReviewReq?: boolean;
  dtFromDate?: string;
  dtToDate?: string;
}

export interface TaskAssignmentCreate {
  strAssignToGUID: string;
  strAssignToType: "USER" | "TEAM";
}

export interface MyTaskParams extends BaseListParams {
  strStatus?: string;
  strPriority?: string;
  strAssignByGUIDs?: string;
}

export interface BoardTaskParams extends BaseListParams {
  strBoardGUID: string; // Required
  strStatuses?: string | string[];
  strBoardSectionGUIDs?: string | string[];
  strPriorities?: string | string[];
  strAssignedByGUIDs?: string | string[];
  strAssignedToGUIDs?: string | string[];
  strReviewedByGUIDs?: string | string[];
  bolIsBillable?: boolean;
  bolIsReviewReq?: boolean;
  dtFromDate?: string;
  dtToDate?: string;
}

export interface AssignedByMeParams extends BaseListParams {
  strStatus?: string;
  strPriority?: string;
  strAssignedToGUIDs?: string;
  strReviewedByGUIDs?: string;
  bolIsPrivate?: boolean;
  strBoardGUIDs?: string;
}

export interface PendingReviewParams extends BaseListParams {
  strStatus?: string;
  strPriority?: string;
}

export interface TaskCreate {
  strBoardGUID?: string | null;
  strBoardSectionGUID?: string | null;
  strBoardSubModuleGUID?: string | null;
  strTitle: string;
  strDescription?: string | null;
  strTicketKey?: string | null;
  strTicketUrl?: string | null;
  strTicketSource?: string | null;
  strStatus?: string;
  strPriority?: string;
  strCompletionRule?: "ANY_ONE" | "ALL_USERS";
  intPercentage?: number;
  strAssignedToGUID?: string | null;
  assignments?: TaskAssignmentCreate[];
  dtStartDate?: string | null;
  dtDueDate?: string | null;
  dtReminderDate?: string | null;
  strReminderTo?: string | null;
  intEstimatedMinutes: number;
  intActualMinutes?: number | null;
  strTags?: string | null;
  bolIsPrivate?: boolean;
  bolIsReviewReq?: boolean;
  bolIsBillable?: boolean;
  bolIsNotificationSend?: boolean;
  strReviewedByGUID?: string | null;
  bolIsTimeTrackingReq?: boolean;
  strAssignedByGUID?: string | null;
  strChecklists?: string[];
  recurrence?: TaskRecurrence | null;
}

export type TaskUpdate = Partial<TaskCreate>;

export type PaginatedTaskResponse = BackendPagedResponse<Task[]>;

export interface TaskViewPosition {
  strTaskViewPositionGUID: string;
  strTaskGUID: string;
  strBoardSectionGUID: string;
  intPosition: number;
  strCreatedByGUID: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID: string | null;
  dtUpdatedOn: string | null;
}

export interface TaskViewPositionParams extends BaseListParams {
  strTaskGUID?: string;
  strBoardSectionGUID?: string;
}

export interface TaskViewPositionCreate {
  strTaskGUID: string;
  strBoardSectionGUID: string;
  intPosition: number;
}

export type TaskViewPositionUpdate = Partial<TaskViewPositionCreate>;

export type TaskViewPositionListResponse = ApiResponse<TaskViewPosition[]>;

export interface MoveTaskRequest {
  strBoardGUID: string;
  strBoardSectionGUID: string;
  intPosition?: number | null;
}

export interface ReorderTasksRequest {
  strBoardSectionGUID: string;
  orderedTaskGUIDs: string[];
}

export interface DuplicateTaskRequest {
  strBoardGUID?: string | null;
  strBoardSectionGUID?: string | null;
}

export interface TaskDocumentUploadRequest {
  files?: File[];
  strRemoveDocumentAssociationGUIDs?: string[];
}

export interface TaskDocumentUploadData {
  removed: number;
  added: number;
}

export type TaskDocumentUploadResponse = ApiResponse<TaskDocumentUploadData>;

export interface BulkTaskCreateOrganization {
  strOrganizationGUID: string;
  strYearGUIDs: string[];
}

export interface BulkTaskCreateRequest {
  strTaskGUID: string;
  organizations: BulkTaskCreateOrganization[];
}

export interface BulkTaskCreateDetail {
  strOrganizationGUID: string;
  strYearGUID: string;
  success: boolean;
  message?: string;
  strNewTaskGUID?: string;
}

export interface BulkTaskCreateResponse {
  totalRequested: number;
  successfullyCreated: number;
  failed: number;
  details: BulkTaskCreateDetail[];
}

export type BulkCreateTaskApiResponse = ApiResponse<BulkTaskCreateResponse>;

export type BulkCreateTaskRequest = BulkTaskCreateRequest;
export type BulkCreateTaskItem = BulkTaskCreateOrganization;
