import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface State {
  strStateGUID: string;
  strCountryGUID: string;
  strName: string;
  bolIsActive: boolean;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID: string;
  dtUpdatedOn: string;
  strCountryName: string;
}

export interface StateCreate {
  strName: string;
  strCountryGUID: string;
  bolIsActive: boolean;
}

export type StateUpdate = StateCreate;

export interface StateParams extends BaseListParams {
  strCountryGUID?: string;
  strCountryGUIDs?: string[]; 
}

export interface StateExportParams {
  format: "excel" | "csv";
}

export type StateListResponse = ApiResponse<PagedResponse<State>>;

export interface StateSimple {
  strStateGUID: string;
  strName: string;
}
