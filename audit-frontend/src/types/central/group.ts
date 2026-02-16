import type { ApiResponse, PagedResponse } from "../common";
import { z } from "zod";
import { groupSchema, newGroupSchema } from "@/validations/central/group";

export type GroupFormValues = z.infer<typeof groupSchema>;
export type NewGroupFormValues = z.infer<typeof newGroupSchema>;

export interface Group {
  strGroupGUID: string;
  strName: string;
  strLicenseNo: string;
  strPAN: string | null;
  strTAN: string | null;
  strCIN: string | null;
  dtLicenseIssueDate: string;
  dtLicenseExpired: string;
  strLogo?: string | null;
  strCreatedByGUID?: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  dtUpdatedOn?: string | null;
}

export interface GroupCreate extends Pick<
  Group,
  "strName" | "strLicenseNo" | "strPAN" | "strTAN" | "strCIN"
> {
  strYearName: string;
  dtStartDate: string;
  dtEndDate: string;
  strIndustryGUID?: string;
  strLegalStatusTypeGUID?: string;
  strUDFCode?: string;
  dtLicenseIssueDate?: string;
  dtLicenseExpired?: string;
  LogoFile?: File;
  // Tax-related fields
  strCountryGUID?: string;
  strCurrencyGUID?: string;
  strTaxTypeGUID?: string;
  strTaxRegNo?: string;
  strStateGUID?: string;
  dtRegistrationDate?: string;
  bolIsDefaultTaxConfig?: boolean;
  bolIsTaxApplied?: boolean;
  jsonTaxSettings?: string;
  // Admin user fields
  strAdminName: string;
  strAdminMobileNo: string;
  strAdminEmailId: string;
  strAdminPassword: string;
  strTimeZone: string;
  strDesignationGUID?: string;
  strDepartmentGUID?: string;
}

export interface GroupUpdate extends Pick<
  Group,
  "strName" | "strLicenseNo" | "strPAN" | "strTAN" | "strCIN"
> {
  dtLicenseIssueDate?: string;
  dtLicenseExpired?: string;
  LogoFile?: File;
}

export interface GroupFormData extends Partial<Omit<Group, "strLogo">> {
  LogoFile: File;
  strLogo?: string;
}

export type GroupListResponse = ApiResponse<PagedResponse<Group>>;
export type GroupResponse = ApiResponse<Group>;

export interface GroupExportParams {
  format: "excel" | "csv";
}
