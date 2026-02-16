import type { ApiResponse, PagedResponse } from "../common";

export interface LegalStatusType {
  strLegalStatusTypeGUID: string;
  strName: string;
  bolIsActive: boolean;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  dtUpdatedOn?: string;
}

export type LegalStatusTypeListResponse = ApiResponse<PagedResponse<LegalStatusType>>;

export interface LegalStatusTypeCreate {
  strName: string;
  bolIsActive: boolean;
}

export type LegalStatusTypeUpdate = LegalStatusTypeCreate;

export interface LegalStatusTypeSimple {
  strLegalStatusTypeGUID: string;
  strName: string;
}

export interface LegalStatusTypeExportParams {
  format: "excel" | "csv";
}
