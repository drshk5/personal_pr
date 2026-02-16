import type { ApiResponse, BaseListParams, PagedResponse } from "@/types";

export interface Year {
  strYearGUID: string;
  strOrganizationGUID: string;
  strName: string;
  dtStartDate: string;
  dtEndDate: string;
  bolIsActive: boolean;
  strPreviousYearGUID?: string;
  strNextYearGUID?: string;
  strGroupGUID: string;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  dtUpdatedOn: string;
  strUpdatedByGUID: string;
  bolSystemCreated: boolean;
  strOrganizationName?: string;
  strPreviousYearName?: string;
  strNextYearName?: string;
  strCreatedBy?: string;
  strUpdatedBy?: string;
  strFormattedStartDate: string;
  strFormattedEndDate: string;
  strFormattedCreatedOn: string;
  strFormattedUpdatedOn: string;
}

export interface YearSimple {
  strYearGUID: string;
  strName: string;
}

export interface YearParams extends BaseListParams {
  organizationGUIDs?: string[];
  createdByGUIDs?: string[];
  updatedByGUIDs?: string[];
}

export interface YearCreate {
  strName: string;
  dtStartDate: Date | string;
  dtEndDate: Date | string;
  bolIsActive: boolean;
  strPreviousYearGUID?: string;
  strNextYearGUID?: string;
}

export type YearUpdate = YearCreate;

export type YearListResponse = ApiResponse<PagedResponse<Year>>;

export interface YearExportParams {
  format: "excel" | "csv";
  organizationId?: string;
}
