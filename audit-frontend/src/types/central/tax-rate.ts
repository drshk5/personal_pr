import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface TaxRate {
  strTaxRateGUID: string;
  strTaxTypeGUID: string;
  strTaxTypeName?: string;
  strTaxTypeCode?: string;
  strTaxCategoryGUID: string;
  strTaxCategoryName?: string;
  strScheduleGUID: string;
  strScheduleName?: string;
  strTaxRateName: string;
  decTaxPercentage: number;
  strTaxRateCode: string;
  strStateGUID?: string;
  strStateName?: string;
  intDisplayOrder: number;
  dtEffectiveFrom?: string;
  dtEffectiveTo?: string;
  bolIsActive: boolean;
  dtCreatedOn: string;
  strCreatedByName?: string;
  dtUpdatedOn?: string;
  strUpdatedByName?: string;
}

export type TaxRateListResponse = ApiResponse<PagedResponse<TaxRate>>;

export interface TaxRateCreate {
  strTaxTypeGUID: string;
  strTaxCategoryGUID: string;
  strScheduleGUID: string;
  strTaxRateName: string;
  decTaxPercentage: number;
  strTaxRateCode: string;
  strStateGUID?: string;
  intDisplayOrder?: number;
  dtEffectiveFrom?: string;
  dtEffectiveTo?: string;
  bolIsActive?: boolean;
}

export type TaxRateUpdate = TaxRateCreate;

export interface TaxRateSimple {
  strTaxRateGUID: string;
  strTaxRateName: string;
  strTaxRateCode: string;
  decTaxPercentage: number;
  strTaxTypeName?: string;
  strTaxCategoryName?: string;
  strStateName?: string;
}

export interface TaxRateFilterParams extends BaseListParams {
  bolIsActive?: boolean;
  strTaxTypeGUID?: string;
  strTaxCategoryGUID?: string;
  strScheduleGUID?: string;
  strStateGUID?: string;
}

export interface TaxRateExportParams {
  format: "excel" | "csv";
}
