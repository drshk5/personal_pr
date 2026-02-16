import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface TaxCategory {
  strTaxCategoryGUID: string;
  strTaxTypeGUID: string;
  strTaxTypeName: string;
  strCategoryCode: string;
  strCategoryName: string;
  strDescription?: string;
  decTotalTaxPercentage: number;
  bolIsActive: boolean;
  strCreatedByGUID: string;
  strCreatedByName?: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  strUpdatedByName?: string;
  dtUpdatedOn?: string;
}

export type TaxCategoryListResponse = ApiResponse<PagedResponse<TaxCategory>>;

export interface TaxCategoryCreate {
  strTaxTypeGUID: string;
  strCategoryCode: string;
  strCategoryName: string;
  strDescription?: string;
  decTotalTaxPercentage: number;
  bolIsActive: boolean;
}

export type TaxCategoryUpdate = TaxCategoryCreate;

export interface TaxCategorySimple {
  strTaxCategoryGUID: string;
  strCategoryCode: string;
  strCategoryName: string;
  decTotalTaxPercentage: number;
}

export interface TaxCategoryFilterParams extends BaseListParams {
  strTaxTypeGUID?: string;
  bolIsActive?: boolean;
  minPercentage?: number;
  maxPercentage?: number;
}

export interface TaxCategoryExportParams {
  format: "excel" | "csv";
  filters?: TaxCategoryFilterParams;
}
