import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface City {
  strCityGUID: string;
  strStateGUID: string;
  strStateName: string;
  strCountryGUID: string;
  strCountryName: string;
  strName: string;
  bolIsActive: boolean;
  dtCreatedOn: string;
  strCreatedByGUID: string;
  dtUpdatedOn?: string;
  strUpdatedByGUID?: string;
}

export interface CityCreate {
  strStateGUID: string;
  strCountryGUID: string;
  strName: string;
  bolIsActive: boolean;
}

export interface CityUpdate {
  strCityGUID: string;
  strStateGUID: string;
  strCountryGUID: string;
  strName: string;
  bolIsActive: boolean;
}

export interface CityParams extends BaseListParams {
  strCountryGUID?: string;
  strStateGUID?: string;
}

export interface CityExportParams {
  format: "excel" | "csv";
}

export type CityListResponse = ApiResponse<PagedResponse<City>>;

export interface ImportCityResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errorMessages: string[];
  missingLocations: Array<{
    countryName: string;
    stateName: string;
  }>;
  duplicateCities: string[];
}

export interface CitySimple {
  strCityGUID: string;
  strName: string;
}
