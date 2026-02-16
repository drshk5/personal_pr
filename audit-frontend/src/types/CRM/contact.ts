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
// Import / Export
// ============================================================

export interface ContactImportResultDto {
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

export interface ContactSuggestMappingResultDto {
  SuggestedMapping: Record<string, string>;
  CsvHeaders: string[];
  AvailableLeadFields: string[];
}

export type ContactDuplicateHandling = "Skip" | "Update" | "Flag";

export const CONTACT_IMPORTABLE_FIELDS = [
  { value: "strAccountGUID", label: "Account GUID", required: false },
  { value: "strFirstName", label: "First Name", required: true },
  { value: "strLastName", label: "Last Name", required: true },
  { value: "strEmail", label: "Email", required: true },
  { value: "strPhone", label: "Phone", required: false },
  { value: "strMobilePhone", label: "Mobile Phone", required: false },
  { value: "strJobTitle", label: "Job Title", required: false },
  { value: "strDepartment", label: "Department", required: false },
  { value: "strLifecycleStage", label: "Lifecycle Stage", required: false },
  { value: "strAddress", label: "Address", required: false },
  { value: "strCity", label: "City", required: false },
  { value: "strState", label: "State", required: false },
  { value: "strCountry", label: "Country", required: false },
  { value: "strPostalCode", label: "Postal Code", required: false },
  { value: "strNotes", label: "Notes", required: false },
  { value: "strAssignedToGUID", label: "Assigned To GUID", required: false },
] as const;

// ============================================================
// Response Types
// ============================================================

export type ContactListResponse = BackendPagedResponse<ContactListDto[]>;
