import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface TaxType {
  strTaxTypeGUID: string;
  strTaxTypeCode: string;
  strTaxTypeName: string;
  strDescription?: string;
  strCountryGUID: string;
  strCountryName?: string;
  bolIsCompound: boolean;
  bolIsActive: boolean;
  dtCreatedOn: string;
  strCreatedByName?: string;
  dtUpdatedOn?: string;
  strUpdatedByName?: string;
}

export type TaxTypeListResponse = ApiResponse<PagedResponse<TaxType>>;

export interface TaxTypeCreate {
  strTaxTypeCode: string;
  strTaxTypeName: string;
  strDescription?: string;
  strCountryGUID: string;
  bolIsCompound: boolean;
  bolIsActive: boolean;
}

export type TaxTypeUpdate = TaxTypeCreate;

export interface TaxTypeSimple extends Omit<
  TaxTypeCreate,
  "strDescription" | "bolIsActive"
> {
  strTaxTypeGUID: string;
  strCountryName?: string;
}

export interface TaxTypeFilterParams extends BaseListParams {
  strCountryGUID?: string;
  bolIsCompound?: boolean;
}

export interface TaxTypeExportParams {
  format: "excel" | "csv";
}
