import type { ApiResponse, PagedResponse } from "../common";

export interface AddressType {
  strAddressTypeGUID: string;
  strName: string;
  bolIsActive: boolean;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  dtUpdatedOn?: string;
}

export type AddressTypeListResponse = ApiResponse<PagedResponse<AddressType>>;

export interface AddressTypeCreate {
  strName: string;
  bolIsActive: boolean;
}

export type AddressTypeUpdate = AddressTypeCreate;

export interface AddressTypeSimple {
  strAddressTypeGUID: string;
  strName: string;
}

export interface AddressTypeExportParams {
  format: "excel" | "csv";
}
