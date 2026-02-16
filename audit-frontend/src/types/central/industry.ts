import type { ApiResponse, PagedResponse } from "../common";

export interface Industry {
  strIndustryGUID: string;
  strName: string;
  bolIsActive: boolean;
  strCreatedByGUID: string;
  strCreatedBy?: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  strUpdatedBy?: string;
  dtUpdatedOn?: string;
}

export type IndustryListResponse = ApiResponse<PagedResponse<Industry>>;

export interface IndustryCreate {
  strName: string;
  bolIsActive: boolean;
}

export type IndustryUpdate = IndustryCreate;

export interface IndustrySimple {
  strIndustryGUID: string;
  strName: string;
}

export interface IndustryExportParams {
  format: "excel" | "csv";
}
