import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface UserRole {
  strUserRoleGUID: string;
  strName: string;
  strDesc?: string;
  bolIsActive: boolean;
  strModuleGUID: string;
  strModuleName: string;
  dtCreatedOn: string;
  strCreatedByGUID: string;
  strCreatedBy?: string;
  dtUpdatedOn?: string;
  strUpdatedByGUID?: string;
  strUpdatedBy?: string;
  bolSystemCreated: boolean;
}

export interface UserRoleListData {
  items: UserRole[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export type UserRoleListResponse = ApiResponse<PagedResponse<UserRoleListData>>;

export interface UserRoleParams extends BaseListParams {
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
}

export interface UserRoleCreate {
  strName: string;
  strDesc?: string;
  bolIsActive: boolean;
}

export type UserRoleUpdate = UserRoleCreate;

export interface UserRoleExportParams {
  format: "excel" | "csv";
}
