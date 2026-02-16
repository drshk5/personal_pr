import type { BackendPagedResponse, BaseListParams } from "../common";
import type { ActivityListDto } from "./activity";

// ============================================================
// Constants
// ============================================================

export const ACCOUNT_INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Consulting",
  "Media",
  "Telecommunications",
  "Energy",
  "Transportation",
  "Agriculture",
  "Government",
  "Non-Profit",
  "Other",
] as const;

export type AccountIndustry = (typeof ACCOUNT_INDUSTRIES)[number];

// ============================================================
// Related Contact DTO (minimal, for account detail)
// ============================================================

export interface ContactListDtoForAccount {
  strContactGUID: string;
  strFirstName: string;
  strLastName: string;
  strEmail: string;
  strPhone?: string | null;
  strJobTitle?: string | null;
  strLifecycleStage: string;
}

// ============================================================
// Related Opportunity DTO (minimal, for account detail)
// ============================================================

export interface OpportunityListDtoForAccount {
  strOpportunityGUID: string;
  strOpportunityName: string;
  strStageName: string;
  strStatus: string;
  dblAmount?: number | null;
  strCurrency: string;
  intProbability: number;
  dtExpectedCloseDate?: string | null;
  bolIsRotting: boolean;
}

// ============================================================
// Account List DTO
// ============================================================

export interface AccountListDto {
  strAccountGUID: string;
  strAccountName: string;
  strIndustry?: string | null;
  strPhone?: string | null;
  strEmail?: string | null;
  intContactCount: number;
  intOpenOpportunityCount: number;
  dblTotalOpportunityValue: number;
  strAssignedToGUID?: string | null;
  strAssignedToName?: string | null;
  dtCreatedOn: string;
  bolIsActive: boolean;
}

// ============================================================
// Account Detail DTO
// ============================================================

export interface AccountDetailDto extends AccountListDto {
  strWebsite?: string | null;
  intEmployeeCount?: number | null;
  dblAnnualRevenue?: number | null;
  strAddress?: string | null;
  strCity?: string | null;
  strState?: string | null;
  strCountry?: string | null;
  strPostalCode?: string | null;
  strDescription?: string | null;
  contacts: ContactListDtoForAccount[];
  opportunities: OpportunityListDtoForAccount[];
  recentActivities: ActivityListDto[];
}

// ============================================================
// Create / Update / Filter DTOs
// ============================================================

export interface CreateAccountDto {
  strAccountName: string;
  strIndustry?: string | null;
  strWebsite?: string | null;
  strPhone?: string | null;
  strEmail?: string | null;
  intEmployeeCount?: number | null;
  dblAnnualRevenue?: number | null;
  strAddress?: string | null;
  strCity?: string | null;
  strState?: string | null;
  strCountry?: string | null;
  strPostalCode?: string | null;
  strDescription?: string | null;
  strAssignedToGUID?: string | null;
}

export interface UpdateAccountDto extends CreateAccountDto {}

export interface AccountFilterParams extends BaseListParams {
  strIndustry?: string;
  strAssignedToGUID?: string;
}

export interface AccountBulkArchiveDto {
  guids: string[];
}

// ============================================================
// Import / Export
// ============================================================

export interface AccountImportResultDto {
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

export interface AccountSuggestMappingResultDto {
  SuggestedMapping: Record<string, string>;
  CsvHeaders: string[];
  AvailableLeadFields: string[];
}

export type AccountDuplicateHandling = "Skip" | "Update" | "Flag";

export const ACCOUNT_IMPORTABLE_FIELDS = [
  { value: "strAccountName", label: "Account Name", required: true },
  { value: "strIndustry", label: "Industry", required: false },
  { value: "strWebsite", label: "Website", required: false },
  { value: "strPhone", label: "Phone", required: false },
  { value: "strEmail", label: "Email", required: false },
  { value: "intEmployeeCount", label: "Employee Count", required: false },
  { value: "dblAnnualRevenue", label: "Annual Revenue", required: false },
  { value: "strAddress", label: "Address", required: false },
  { value: "strCity", label: "City", required: false },
  { value: "strState", label: "State", required: false },
  { value: "strCountry", label: "Country", required: false },
  { value: "strPostalCode", label: "Postal Code", required: false },
  { value: "strDescription", label: "Description", required: false },
  { value: "strAssignedToGUID", label: "Assigned To GUID", required: false },
] as const;

// ============================================================
// Response Types
// ============================================================

export type AccountListResponse = BackendPagedResponse<AccountListDto[]>;
