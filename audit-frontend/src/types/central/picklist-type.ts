import type { ApiResponse, PagedResponse } from "../common";

export interface PicklistType {
  strPicklistTypeGUID: string;
  strType: string;
  strDescription?: string;
  bolIsActive: boolean;
  strGroupGUID: string;
  strCreatedByGUID: string;
  dtCreatedOn: string;
}

export type PicklistTypeListResponse = ApiResponse<PagedResponse<PicklistType>>;

export interface PicklistTypeCreate {
  strType: string;
  strDescription?: string;
  bolIsActive: boolean;
}

export type PicklistTypeUpdate = PicklistTypeCreate;

export interface PicklistTypeSimple {
  strPicklistTypeGUID: string;
  strType: string;
  strDescription?: string;
}

export interface PicklistTypeExportParams {
  format: "excel" | "csv";
}
