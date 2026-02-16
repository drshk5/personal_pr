import type { ApiResponse, PagedResponse } from "../common";

export interface CurrencyType {
  strCurrencyTypeGUID: string;
  strName: string;
  strCountryGUID?: string;
  strCountryName?: string;
  bolIsActive: boolean;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  dtUpdatedOn?: string;
}

export type CurrencyTypeListResponse = ApiResponse<PagedResponse<CurrencyType>>;

export interface CurrencyTypeExportParams {
  format: "excel" | "csv";
}

export interface CurrencyTypeCreate {
  strName: string;
  strCountryGUID?: string;
  bolIsActive: boolean;
}

export type CurrencyTypeUpdate = CurrencyTypeCreate;

export interface CurrencyTypeSimple {
  strCurrencyTypeGUID: string;
  strName: string;
}
