import type { ApiResponse, BaseListParams, PagedResponse } from "@/types";

export interface UserDetails {
  strUserDetailGUID: string;
  strUserGUID: string;
  strOrganizationGUID: string;
  strUserRoleGUID: string;
  strGroupGUID: string;
  strYearGUID?: string;
  bolIsActive: boolean;
  strCreatedByGUID: string;
  strCreatedBy: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  strUpdatedBy?: string;
  dtUpdatedOn?: string;
  strUserName: string;
  strUserRoleName: string;
  strOrganizationName: string;
  strYearName?: string;
}

export interface UserDetailsSimple {
  strUserDetailGUID: string;
  strUserName: string;
}

export interface UserDetailsParams extends BaseListParams {
  strOrganizationGUID?: string;
  strUserRoleGUID?: string;
  strUserGUID?: string;
  strYearGUID?: string;
}

export interface UserDetailsCreate {
  strUserGUID: string;
  strUserRoleGUID: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  bolIsActive?: boolean;
}

export interface UserDetailsBulkCreate {
  strUserGUIDs: string[];
  strUserRoleGUID: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  bolIsActive: boolean;
}

export interface BulkUserDetailsError {
  strUserGUID: string;
  errorMessage: string;
}

export interface BulkUserDetailsResponse {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  successfulRecords: UserDetails[];
  errors: BulkUserDetailsError[];
}

export type UserDetailsListResponse = ApiResponse<PagedResponse<UserDetails>>;
