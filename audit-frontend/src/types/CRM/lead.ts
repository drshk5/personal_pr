import type { BackendPagedResponse, BaseListParams } from "../common";
import type { ActivityListDto } from "./activity";

// ============================================================
// Constants
// ============================================================

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Unqualified",
  "Converted",
] as const;

export const LEAD_ACTIVE_STATUSES = ["New", "Contacted", "Qualified"] as const;

export const LEAD_CONVERTIBLE_STATUSES = ["Qualified"] as const;

export const LEAD_SOURCES = [
  "Website",
  "Referral",
  "LinkedIn",
  "ColdCall",
  "Advertisement",
  "TradeShow",
  "Other",
] as const;

export const LEAD_ASSIGNMENT_STRATEGIES = [
  "Manual",
  "RoundRobin",
  "Territory",
  "Capacity",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadAssignmentStrategy = (typeof LEAD_ASSIGNMENT_STRATEGIES)[number];

// ============================================================
// Lead List DTO — enriched with aging + SLA + duplicate flag
// ============================================================

export interface LeadListDto {
  strLeadGUID: string;
  strFirstName: string;
  strLastName: string;
  strEmail: string;
  strPhone?: string | null;
  strCompanyName?: string | null;
  strSource: string;
  strStatus: string;
  intLeadScore: number;
  strAssignedToGUID?: string | null;
  strAssignedToName?: string | null;
  dtCreatedOn: string;
  dtLastActivityOn?: string | null;
  bolIsActive: boolean;
  // Computed by backend
  intDaysSinceLastActivity?: number | null;
  bolIsSLABreached?: boolean;
  bolHasDuplicates?: boolean;
}

// ============================================================
// Lead Detail DTO — with score breakdown + duplicates
// ============================================================

export interface LeadDetailDto extends LeadListDto {
  strJobTitle?: string | null;
  strAddress?: string | null;
  strCity?: string | null;
  strState?: string | null;
  strCountry?: string | null;
  strPostalCode?: string | null;
  strNotes?: string | null;
  strConvertedAccountGUID?: string | null;
  strConvertedContactGUID?: string | null;
  strConvertedOpportunityGUID?: string | null;
  dtConvertedOn?: string | null;
  strCreatedByName: string;
  dtUpdatedOn?: string | null;
  recentActivities: ActivityListDto[];
  // Score breakdown
  scoreBreakdown?: LeadScoreFactorDto[];
  // Potential duplicates
  duplicates?: LeadDuplicateDto[];
}

// ============================================================
// Lead Score — breakdown + decay + negative
// ============================================================

export interface LeadScoreFactorDto {
  strFactor: string;       // e.g. "Has email", "Time decay", "Bounced email"
  intPoints: number;       // +10, -15, -5 etc.
  strCategory: string;     // "data_completeness" | "engagement" | "decay" | "negative"
}

export interface LeadScoringRuleDto {
  strRuleGUID: string;
  strRuleName: string;
  strConditionField: string;
  strConditionOperator: string;   // "equals", "contains", "greater_than", "days_since"
  strConditionValue: string;
  intPoints: number;
  strCategory: string;
  bolIsActive: boolean;
  intDisplayOrder: number;
}

export interface CreateScoringRuleDto {
  strRuleName: string;
  strConditionField: string;
  strConditionOperator: string;
  strConditionValue: string;
  intPoints: number;
  strCategory: string;
  bolIsActive: boolean;
  intDisplayOrder: number;
}

export type UpdateScoringRuleDto = CreateScoringRuleDto;

// ============================================================
// Duplicate Detection
// ============================================================

export interface LeadDuplicateDto {
  strLeadGUID: string;
  strFirstName: string;
  strLastName: string;
  strEmail: string;
  strCompanyName?: string | null;
  strStatus: string;
  dblMatchScore: number;   // 0-100 fuzzy match confidence
  strMatchReason: string;  // "email_exact" | "name_fuzzy" | "phone_match"
}

export interface LeadMergeDto {
  strPrimaryLeadGUID: string;
  strDuplicateLeadGUIDs: string[];
  fieldOverrides?: Record<string, string>;  // which fields to keep from which lead
}

export interface LeadMergeResultDto {
  strMergedLeadGUID: string;
  intActivitiesMerged: number;
  intDuplicatesArchived: number;
  strMessage: string;
}

export interface DuplicateCheckResultDto {
  bolHasDuplicates: boolean;
  duplicates: LeadDuplicateDto[];
}

// ============================================================
// Import / Export
// ============================================================

/** Column mapping sent to the backend as a Dictionary<csvColumn, leadField> */
export type LeadImportColumnMapping = Record<string, string>;

/**
 * Legacy array-style mapping DTO — kept for backward compat but the service
 * now converts this to the backend's Dictionary format.
 */
export interface LeadImportMappingDto {
  strCsvColumn: string;
  strLeadField: string;
}

/** Matches the backend ImportJobListDto exactly */
export interface LeadImportResultDto {
  strImportJobGUID: string;
  strFileName: string;
  strStatus: string;
  intTotalRows: number;
  intProcessedRows: number;
  intSuccessRows: number;
  intErrorRows: number;
  intDuplicateRows: number;
  strDuplicateHandling: string;
  dtCreatedOn: string;
  dtCompletedOn?: string | null;
}

/** Matches the backend ImportJobDetailDto which extends ImportJobListDto */
export interface LeadImportDetailDto extends LeadImportResultDto {
  strColumnMappingJson: string;
  Errors: LeadImportErrorDto[];
}

/** Matches the backend ImportJobErrorDto */
export interface LeadImportErrorDto {
  strImportJobErrorGUID: string;
  intRowNumber: number;
  strRawData?: string | null;
  strErrorMessage: string;
  strErrorType: string;
}

/** Duplicate handling strategies accepted by the backend */
export type DuplicateHandlingStrategy = "Skip" | "Update" | "Flag";

export const LEAD_IMPORTABLE_FIELDS = [
  { value: "strFirstName", label: "First Name", required: true },
  { value: "strLastName", label: "Last Name", required: true },
  { value: "strEmail", label: "Email", required: true },
  { value: "strPhone", label: "Phone", required: false },
  { value: "strCompanyName", label: "Company Name", required: false },
  { value: "strJobTitle", label: "Job Title", required: false },
  { value: "strSource", label: "Source", required: false },
  { value: "strAddress", label: "Address", required: false },
  { value: "strCity", label: "City", required: false },
  { value: "strState", label: "State", required: false },
  { value: "strCountry", label: "Country", required: false },
  { value: "strPostalCode", label: "Postal Code", required: false },
  { value: "strNotes", label: "Notes", required: false },
] as const;

// ============================================================
// Assignment Rules
// ============================================================

export interface LeadAssignmentRuleDto {
  strRuleGUID: string;
  strStrategy: LeadAssignmentStrategy;
  strRuleName: string;
  strDescription?: string | null;
  // For territory: city/state/country conditions
  strTerritoryField?: string | null;
  strTerritoryValues?: string[] | null;
  strAssignToGUID?: string | null;        // for Territory/Capacity
  strAssignToName?: string | null;
  intMaxCapacity?: number | null;          // for Capacity
  intCurrentCount?: number | null;
  bolIsActive: boolean;
  intPriority: number;
}

export interface BulkAssignDto {
  guids: string[];
  strAssignedToGUID: string;
}

export interface AutoAssignResultDto {
  intAssigned: number;
  assignments: { strLeadGUID: string; strAssignedToGUID: string; strAssignedToName: string }[];
}

// ============================================================
// Lead Aging / SLA
// ============================================================

export interface LeadSLAConfigDto {
  intNewMaxHours: number;             // max hours a lead can stay "New" untouched
  intContactedFollowUpHours: number;  // max hours between follow-ups
  intQualifiedConvertMaxDays: number; // max days qualified lead should stay unconverted
  intStaleLeadDays: number;           // days with no activity = stale
}

// ============================================================
// Conversion Funnel Analytics
// ============================================================

export interface LeadFunnelDto {
  strStatus: string;
  intCount: number;
  dblPercentage: number;
}

export interface LeadAnalyticsDto {
  funnel: LeadFunnelDto[];
  dblConversionRate: number;
  dblAvgTimeToConversionDays: number;
  intNewThisWeek: number;
  intConvertedThisMonth: number;
  sourceBreakdown: { strSource: string; intCount: number; intConverted: number }[];
  repPerformance: { strRepName: string; intTotal: number; intConverted: number; dblConversionRate: number }[];
}

// ============================================================
// Create / Update / Filter DTOs (unchanged + enriched)
// ============================================================

export interface CreateLeadDto {
  strFirstName: string;
  strLastName: string;
  strEmail: string;
  strPhone?: string | null;
  strCompanyName?: string | null;
  strJobTitle?: string | null;
  strSource: string;
  strAddress?: string | null;
  strCity?: string | null;
  strState?: string | null;
  strCountry?: string | null;
  strPostalCode?: string | null;
  strNotes?: string | null;
  strAssignedToGUID?: string | null;
  bolSkipDuplicateCheck?: boolean;
}

export interface UpdateLeadDto extends CreateLeadDto {
  strStatus: string;
}

export interface LeadFilterParams extends BaseListParams {
  strStatus?: string;
  strSource?: string;
  strAssignedToGUID?: string;
  dtFromDate?: string;
  dtToDate?: string;
  intMinScore?: number;
  intMaxScore?: number;
  bolIsSLABreached?: boolean;
  bolIsStale?: boolean;
  bolHasDuplicates?: boolean;
}

export interface LeadBulkArchiveDto {
  guids: string[];
}

// ============================================================
// Lead Conversion
// ============================================================

export interface ConvertLeadDto {
  strLeadGUID: string;
  bolCreateAccount: boolean;
  bolCreateOpportunity: boolean;
  strExistingAccountGUID?: string | null;
  strOpportunityName?: string | null;
  strPipelineGUID?: string | null;
  dblAmount?: number | null;
}

export interface LeadConversionResultDto {
  strLeadGUID: string;
  strContactGUID: string;
  strAccountGUID?: string | null;
  strOpportunityGUID?: string | null;
  strMessage: string;
}

// ============================================================
// Response Types
// ============================================================

export type LeadListResponse = BackendPagedResponse<LeadListDto[]>;
