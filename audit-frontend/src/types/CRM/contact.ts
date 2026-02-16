import type { BackendPagedResponse, BaseListParams } from "../common";
import type { ActivityListDto } from "./activity";

// ============================================================
// Constants
// ============================================================

export const CONTACT_LIFECYCLE_STAGES = [
  "Subscriber",
  "Lead",
  "MQL",
  "SQL",
  "Opportunity",
  "Customer",
  "Evangelist",
] as const;

export type ContactLifecycleStage = (typeof CONTACT_LIFECYCLE_STAGES)[number];

// ============================================================
// Contact List DTO
// ============================================================

export interface ContactListDto {
  strContactGUID: string;
  strFirstName: string;
  strLastName: string;
  strEmail: string;
  strPhone?: string | null;
  strJobTitle?: string | null;
  strAccountName?: string | null;
  strLifecycleStage: string;
  strAssignedToGUID?: string | null;
  strAssignedToName?: string | null;
  dtCreatedOn: string;
  bolIsActive: boolean;
}

// ============================================================
// Contact Detail DTO
// ============================================================

export interface ContactDetailDto extends ContactListDto {
  strAccountGUID?: string | null;
  strMobilePhone?: string | null;
  strDepartment?: string | null;
  strAddress?: string | null;
  strCity?: string | null;
  strState?: string | null;
  strCountry?: string | null;
  strPostalCode?: string | null;
  strNotes?: string | null;
  dtLastContactedOn?: string | null;
  opportunities: OpportunityListDtoForContact[];
  recentActivities: ActivityListDto[];
}

// ============================================================
// Related Opportunity DTO (minimal, for contact detail)
// ============================================================

export interface OpportunityListDtoForContact {
  strOpportunityGUID: string;
  strOpportunityName: string;
  strStageName: string;
  strStatus: string;
  dblAmount?: number | null;
  strCurrency: string;
}

// ============================================================
// Create / Update / Filter DTOs
// ============================================================

export interface CreateContactDto {
  strAccountGUID?: string | null;
  strFirstName: string;
  strLastName: string;
  strEmail: string;
  strPhone?: string | null;
  strMobilePhone?: string | null;
  strJobTitle?: string | null;
  strDepartment?: string | null;
  strLifecycleStage?: string | null;
  strAddress?: string | null;
  strCity?: string | null;
  strState?: string | null;
  strCountry?: string | null;
  strPostalCode?: string | null;
  strNotes?: string | null;
  strAssignedToGUID?: string | null;
}

export interface UpdateContactDto extends CreateContactDto {}

export interface ContactFilterParams extends BaseListParams {
  strAccountGUID?: string;
  strLifecycleStage?: string;
  strAssignedToGUID?: string;
}

export interface ContactBulkArchiveDto {
  guids: string[];
}

// ============================================================
// Response Types
// ============================================================

export type ContactListResponse = BackendPagedResponse<ContactListDto[]>;
