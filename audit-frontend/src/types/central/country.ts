import type { ApiResponse, PagedResponse } from "../common";

export interface Country {
  strCountryGUID: string;
  strName: string;
  strCountryCode?: string | null;
  strDialCode?: string | null;
  intPhoneMinLength?: number | null;
  intPhoneMaxLength?: number | null;
  bolIsActive: boolean;
}

export interface CountryCreate {
  strName: string;
  strCountryCode?: string | null;
  strDialCode?: string | null;
  intPhoneMinLength?: number | null;
  intPhoneMaxLength?: number | null;
  bolIsActive: boolean;
}

export type CountryUpdate = CountryCreate;

export interface CountryExportParams {
  format: "excel" | "csv";
}

export interface CountryImportResult {
  TotalRows: number;
  SuccessCount: number;
  FailureCount: number;
  ErrorMessages: string[];
}

export type CountryImportResponse = ApiResponse<CountryImportResult>;

export type CountryListResponse = ApiResponse<PagedResponse<Country>>;

export interface CountrySimple {
  strCountryGUID: string;
  strName: string;
  strCountryCode?: string | null;
  strDialCode?: string | null;
  intPhoneMinLength?: number | null;
  intPhoneMaxLength?: number | null;
}

export interface CountryCurrencyResponse {
  strCountryGUID: string;
  strCurrencyTypeGUID: string;
}
