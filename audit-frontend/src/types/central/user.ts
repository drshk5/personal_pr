import type { BaseListParams, ApiPagedResponse, ApiResponse } from "@/types";

export type AuthResponseData = {
  Token: string;
};

export type LoginResponse = ApiResponse<AuthResponseData>;

export interface BaseUser {
  strName: string;
  dtBirthDate?: string | null;
  strMobileNo: string;
  strEmailId: string;
  bolIsActive: boolean;
  dtWorkingStartTime?: string | null;
  dtWorkingEndTime?: string | null;
}

export interface User extends BaseUser {
  strUserGUID: string;
  bolIsSuperAdmin: boolean;
  strGroupGUID: string;
  strCreatedByGUID: string;
  strCreatedBy: string;
  dtCreatedOn: string;
  strUpdatedByGUID: string | null;
  strUpdatedBy: string;
  dtUpdatedOn: string | null;
  strLastOrganizationGUID: string | null;
  strProfileImg: string | null;
  strTimeZone: string | null;
  strDesignationGUID: string | null;
  strDesignationName: string | null;
  strDepartmentGUID: string | null;
  strDepartmentName: string | null;
  bolSystemCreated: boolean;
  // Additional properties from UserProfileData
  strGroupName?: string | null;
  strGroupLogo?: string | null;
  strLastOrganizationName?: string | null;
  strLastOrganizationLogo?: string | null;
  strCountryGUID?: string | null;
  strCurrencyTypeGUID?: string | null;
  strCurrencyTypeName?: string | null;
  strTaxTypeGUID?: string | null;
  strTaxTypeCode?: string | null;
  bolIsTaxApplied?: boolean | null;
  strLastYearGUID?: string | null;
  strLastYearName?: string | null;
  dtYearStartDate?: string | null;
  dtYearEndDate?: string | null;
  strLastModuleGUID?: string | null;
  strLastModuleName?: string | null;
  strLastModuleDesc?: string | null;
  strUserRoleGUID?: string | null;
  strUserRoleName?: string | null;
  modules?: ModuleInfo[];
}

export type UserSimple = Omit<
  User,
  "strCreatedBy" | "strUpdatedBy" | "strDesignationName" | "strDepartmentName"
>;

export interface UserCreate {
  strName: string;
  dtBirthDate?: string | null;
  strMobileNo: string;
  strPassword: string;
  strEmailId: string;
  bolIsActive: boolean;
  dtWorkingStartTime?: string | null;
  dtWorkingEndTime?: string | null;
  strRoleGUID: string;
  strDesignationGUID?: string | null;
  strDepartmentGUID?: string | null;
  ProfileImgFile?: File;
  strProfileImg?: string;
  strTimeZone: string;
}

export interface UserUpdate extends Omit<
  UserCreate,
  "strPassword" | "strRoleGUID"
> {
  RemoveProfileImage?: boolean;
}

export interface UserParams extends BaseListParams {
  dtBirthDateFrom?: string;
  dtBirthDateUpto?: string;
  strGUIDsCreatedBy?: string | string[];
  strGUIDsUpdatedBy?: string | string[];
  strDesignationGUIDs?: string | string[];
  strDepartmentGUIDs?: string | string[];
}

export interface UserByOrgModuleParams extends BaseListParams {
  bolIsActive?: boolean;
}

export type UserListResponse = ApiPagedResponse<User>;
export type UserByOrgModuleResponse = ApiPagedResponse<User>;

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface LoginRequest {
  strEmailId: string;
  strPassword: string;
  bolIsForce?: boolean;
}

export interface ActiveSessionInfo {
  strDeviceInfo?: string;
  strIPAddress?: string;
  dtCreatedOn: string;
  dtExpiresAt?: string;
}

export interface SessionExistsData {
  hasActiveSession: boolean;
  sessions: ActiveSessionInfo[];
}

export type SessionExistsError = ApiResponse<SessionExistsData>;

export interface ResetPasswordRequest {
  strOTP: string;
  strEmailId: string;
  strNewPassword: string;
}

export interface ResetPasswordCredentials {
  strOtp: string;
  strEmailId: string;
  strNewPassword: string;
}

export type ModuleInfo = {
  strModuleGUID: string;
  strModuleName: string;
  strDesc: string;
  strImagePath: string;
};

// Matches central-backend DTO: OrgTaxConfigResponseDto
export type OrgTaxConfig = {
  strOrgTaxConfigGUID: string;
  strOrganizationGUID: string;
  strOrganizationName?: string | null;
  strTaxTypeGUID: string;
  strTaxTypeName?: string | null;
  strTaxTypeCode?: string | null;
  strTaxRegNo?: string | null;
  strStateGUID?: string | null;
  strStateName?: string | null;
  dtRegistrationDate?: string | null;
  bolIsActive: boolean;
  jsonSettings?: string | null;
  strCreatedByGUID: string;
  dtCreatedDate: string;
};

export type UserProfileData = {
  strUserGUID: string;
  strName: string;
  strEmailId: string;
  strMobileNo: string;
  dtBirthDate: string | null;
  bolIsActive: boolean;
  dtWorkingStartTime: string | null;
  dtWorkingEndTime: string | null;
  bolIsSuperAdmin: boolean;
  strProfileImg: string | null;
  strTimeZone: string;
  modules?: ModuleInfo[];
  strGroupGUID: string | null;
  strGroupName: string | null;
  strGroupLogo: string | null;
  strLastOrganizationGUID: string | null;
  strLastOrganizationName: string | null;
  strLastOrganizationLogo: string | null;
  strCountryGUID: string | null;
  strCurrencyTypeGUID: string | null;
  strCurrencyTypeName: string | null;
  strTaxTypeGUID: string | null;
  strTaxTypeCode: string | null;
  bolIsTaxApplied: boolean | null;
  strLastYearGUID: string | null;
  strLastYearName: string | null;
  dtYearStartDate: string | null;
  dtYearEndDate: string | null;
  strLastModuleGUID: string | null;
  strLastModuleName: string | null;
  strLastModuleDesc: string | null;
  strUserRoleGUID: string | null;
  strUserRoleName: string | null;
  // Tax configuration for current organization (optional)
  tax?: OrgTaxConfig | null;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID: string | null;
  dtUpdatedOn: string | null;
};
