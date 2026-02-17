import type { BackendPagedResponse, BaseListParams } from "../common";
import type { ActivityListDto } from "./activity";

// ============================================================
// Constants
// ============================================================

export const OPPORTUNITY_STATUSES = ["Open", "Won", "Lost"] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_CONTACT_ROLES = [
  "DecisionMaker",
  "Influencer",
  "Champion",
  "Stakeholder",
  "EndUser",
] as const;

export type OpportunityContactRole =
  (typeof OPPORTUNITY_CONTACT_ROLES)[number];

export const OPPORTUNITY_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "SGD",
  "AED",
] as const;

export type OpportunityCurrency = (typeof OPPORTUNITY_CURRENCIES)[number];

// ============================================================
// Opportunity Contact DTO
// ============================================================

export interface OpportunityContactDto {
  strContactGUID: string;
  strContactName?: string | null;
  strRole: string;
  bolIsPrimary: boolean;
}

// ============================================================
// Opportunity List DTO
// ============================================================

export interface OpportunityListDto {
  strOpportunityGUID: string;
  strOpportunityName: string;
  strAccountName?: string | null;
  strStageName: string;
  strStatus: string;
  dblAmount?: number | null;
  strCurrency: string;
  intProbability: number;
  dtExpectedCloseDate?: string | null;
  bolIsRotting: boolean;
  strAssignedToGUID?: string | null;
  strAssignedToName?: string | null;
  dtCreatedOn: string;
  bolIsActive: boolean;
}

// ============================================================
// Opportunity Detail DTO
// ============================================================

export interface OpportunityDetailDto extends OpportunityListDto {
  strAccountGUID?: string | null;
  strPipelineGUID: string;
  strPipelineName: string;
  strStageGUID: string;
  dtActualCloseDate?: string | null;
  strLossReason?: string | null;
  strDescription?: string | null;
  dtStageEnteredOn: string;
  dtLastActivityOn?: string | null;
  intDaysInStage: number;
  contacts: OpportunityContactDto[];
  recentActivities: ActivityListDto[];
}

// ============================================================
// Create / Update / Filter / Close DTOs
// ============================================================

export interface CreateOpportunityDto {
  strOpportunityName: string;
  strAccountGUID?: string | null;
  strPipelineGUID: string;
  strStageGUID: string;
  dblAmount?: number | null;
  strCurrency?: string;
  dtExpectedCloseDate?: string | null;
  strDescription?: string | null;
  strAssignedToGUID?: string | null;
  contacts?: OpportunityContactDto[];
}

export interface UpdateOpportunityDto {
  strOpportunityName: string;
  strAccountGUID?: string | null;
  strStageGUID: string;
  dblAmount?: number | null;
  strCurrency?: string;
  dtExpectedCloseDate?: string | null;
  strDescription?: string | null;
  strAssignedToGUID?: string | null;
}

export interface CloseOpportunityDto {
  strStatus: string; // Won or Lost
  strLossReason?: string | null;
  dtActualCloseDate?: string | null;
}

export interface MoveStageDto {
  strStageGUID: string;
  strLossReason?: string | null;
}

export interface AddOpportunityContactDto {
  strContactGUID: string;
  strRole?: string;
  bolIsPrimary?: boolean;
}

export interface OpportunityFilterParams extends BaseListParams {
  strStatus?: string;
  strPipelineGUID?: string;
  strStageGUID?: string;
  strAccountGUID?: string;
  strAssignedToGUID?: string;
  dblMinAmount?: number;
  dblMaxAmount?: number;
  dtFromDate?: string;
  dtToDate?: string;
  bolIsRotting?: boolean;
}

export interface OpportunityBulkArchiveDto {
  guids: string[];
}

// ============================================================
// Board / Kanban View
// ============================================================

export interface OpportunityBoardDto {
  strStageGUID: string;
  strStageName: string;
  intDisplayOrder: number;
  intProbabilityPercent: number;
  bolIsWonStage: boolean;
  bolIsLostStage: boolean;
  opportunities: OpportunityListDto[];
  dblTotalValue: number;
  intCount: number;
}

// ============================================================
// Response Types
// ============================================================

export type OpportunityListResponse =
  BackendPagedResponse<OpportunityListDto[]>;
