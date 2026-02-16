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
// Response Types
// ============================================================

export type AccountListResponse = BackendPagedResponse<AccountListDto[]>;
