import type { BaseListParams } from "@/types";
import type { AssignTaskAssignment } from "@/types/task/task";

export interface AddReviewDto {
  strTaskGUID: string;
  strReview: string;
}

export interface UpdateReviewDto {
  strReview: string;
}

export interface ReviewTask {
  strReviewTaskGUID: string;
  strTaskGUID: string;
  strReview: string | null;
  strCreatedByGUID: string | null;
  strCreatedBy: string | null;
  strProfileImg?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID: string | null;
  strUpdatedBy: string | null;
  dtUpdatedOn: string | null;
}

export interface ReviewTaskSimple {
  strReviewTaskGUID: string;
  strTaskGUID: string;
  strReview: string | null;
  dtCreatedOn: string;
}

export interface PendingReviewTaskParams extends BaseListParams {
  strStatus?: string;
  strStatuses?: string;
  strPriority?: string;
  strPriorities?: string;
  strBoardGUIDs?: string;
}

export interface PendingReviewTask {
  strTaskGUID: string;
  strTaskNo: number;
  strBoardGUID: string | null;
  strBoardName?: string | null;
  strBoardSectionGUID: string | null;
  strBoardSectionName?: string | null;
  strBoardSubModuleGUID?: string | null;
  strBoardSubModuleName?: string | null;
  strOrganizationGUID: string;
  strYearGUID: string;
  strTitle: string;
  strDescription?: string | null;
  strStatus: string;
  strPriority: string;
  strTicketKey?: string | null;
  strTicketUrl?: string | null;
  strTicketSource?: string | null;
  strAssignedToGUID?: string | null;
  strAssignedTo?: string | null;
  strAssignedByGUID?: string | null;
  strAssignedBy?: string | null;
  assignments?: AssignTaskAssignment[];
  dtStartDate?: string | null;
  dtDueDate?: string | null;
  intEstimatedMinutes?: number | null;
  intActualMinutes?: number | null;
  strTotalTime?: string | null;
  strTags?: string | null;
  bolIsPrivate?: boolean;
  intChecklistsCount?: number;
  intFilesCount?: number;
}

export interface PendingReviewTasksPayload {
  items: PendingReviewTask[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
