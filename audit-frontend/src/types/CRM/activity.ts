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
  strAssignedToGUID?: string | null;
  strAssignedToName?: string | null;
  strCreatedByGUID?: string | null;
  strCreatedByName: string;
  dtCreatedOn: string;
  bolIsActive: boolean;
  links: ActivityLinkDto[];
}

// ============================================================
// Create Activity DTO (Immutable — no update/delete)
// ============================================================

export interface CreateActivityDto {
  strActivityType: string;
  strSubject: string;
  strDescription?: string | null;
  dtScheduledOn?: string | null;
  dtCompletedOn?: string | null;
  intDurationMinutes?: number | null;
  strOutcome?: string | null;
  strAssignedToGUID?: string | null;
  links: ActivityLinkDto[];
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
  dtScheduledOn?: string | null;
  strEntityName?: string | null;
}

// ============================================================
// Response Types
// ============================================================

export type ActivityListResponse = BackendPagedResponse<ActivityListDto[]>;
