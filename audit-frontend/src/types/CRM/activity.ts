import type { BackendPagedResponse, BaseListParams } from "../common";

// ============================================================
// Constants
// ============================================================

export const ACTIVITY_TYPES = [
  "Call",
  "Email",
  "Meeting",
  "Note",
  "Task",
  "FollowUp",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ENTITY_TYPES = [
  "Lead",
  "Contact",
  "Account",
  "Opportunity",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ACTIVITY_STATUSES = [
  "Pending",
  "InProgress",
  "Completed",
  "Cancelled",
] as const;

export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const ACTIVITY_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Urgent",
] as const;

export type ActivityPriority = (typeof ACTIVITY_PRIORITIES)[number];

// ============================================================
// Activity Link DTO
// ============================================================

export interface ActivityLinkDto {
  strEntityType: string;
  strEntityGUID: string;
}

// ============================================================
// Activity List DTO
// ============================================================

export interface ActivityListDto {
  strActivityGUID: string;
  strActivityType: string;
  strSubject: string;
  strDescription?: string | null;
  dtScheduledOn?: string | null;
  dtCompletedOn?: string | null;
  intDurationMinutes?: number | null;
  strOutcome?: string | null;
  strStatus: string;
  strPriority: string;
  dtDueDate?: string | null;
  strCategory?: string | null;
  bolIsOverdue?: boolean;
  strAssignedToGUID?: string | null;
  strAssignedToName?: string | null;
  strCreatedByGUID?: string | null;
  strCreatedByName: string;
  dtCreatedOn: string;
  dtUpdatedOn?: string | null;
  bolIsActive: boolean;
  links: ActivityLinkDto[];
}

// ============================================================
// Create Activity DTO
// ============================================================

export interface CreateActivityDto {
  strActivityType: string;
  strSubject: string;
  strDescription?: string | null;
  dtScheduledOn?: string | null;
  dtCompletedOn?: string | null;
  intDurationMinutes?: number | null;
  strOutcome?: string | null;
  strStatus?: string | null;
  strPriority?: string | null;
  dtDueDate?: string | null;
  strCategory?: string | null;
  strAssignedToGUID?: string | null;
  links: ActivityLinkDto[];
}

// ============================================================
// Update Activity DTO
// ============================================================

export interface UpdateActivityDto {
  strActivityType: string;
  strSubject: string;
  strDescription?: string | null;
  dtScheduledOn?: string | null;
  dtCompletedOn?: string | null;
  intDurationMinutes?: number | null;
  strOutcome?: string | null;
  strStatus?: string | null;
  strPriority?: string | null;
  dtDueDate?: string | null;
  strCategory?: string | null;
  strAssignedToGUID?: string | null;
  links?: ActivityLinkDto[] | null;
}

// ============================================================
// Status Change DTO
// ============================================================

export interface ActivityStatusChangeDto {
  strStatus: string;
  strOutcome?: string | null;
}

// ============================================================
// Assign DTO
// ============================================================

export interface ActivityAssignDto {
  strAssignedToGUID: string;
}

// ============================================================
// Activity Filter Params
// ============================================================

export interface ActivityFilterParams extends BaseListParams {
  strActivityType?: string;
  strEntityType?: string;
  strEntityGUID?: string;
  strAssignedToGUID?: string;
  dtFromDate?: string;
  dtToDate?: string;
  bolIsCompleted?: boolean;
}

// ============================================================
// Upcoming Activity DTO (Dashboard)
// ============================================================

export interface UpcomingActivityDto {
  strActivityGUID: string;
  strActivityType: string;
  strSubject: string;
  strStatus: string;
  strPriority: string;
  dtScheduledOn?: string | null;
  dtDueDate?: string | null;
  bolIsOverdue?: boolean;
  strAssignedToGUID?: string | null;
  strAssignedToName?: string | null;
  strCategory?: string | null;
  strEntityName?: string | null;
  links: ActivityLinkDto[];
}

// ============================================================
// Response Types
// ============================================================

export type ActivityListResponse = BackendPagedResponse<ActivityListDto[]>;
