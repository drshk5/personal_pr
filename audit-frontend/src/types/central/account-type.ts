import type { ApiResponse, PagedResponse } from "../common";

export interface AccountType {
  strAccountTypeGUID: string;
  strName: string;
  bolIsActive: boolean;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  dtUpdatedOn?: string;
}

export type AccountTypeListResponse = ApiResponse<PagedResponse<AccountType>>;

export interface AccountTypeCreate {
  strName: string;
  bolIsActive: boolean;
}

export type  AccountTypeUpdate = AccountTypeCreate

export interface AccountTypeSimple {
  strAccountTypeGUID: string;
  strName: string;
}

export interface AccountTypeExportParams {
  format: "excel" | "csv";
}
