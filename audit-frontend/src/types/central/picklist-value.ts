import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface PicklistValue {
  strPickListValueGUID: string; 
  strPicklistValueGUID?: string;
  strValue: string;
  strPicklistTypeGUID: string;
  strPicklistType: string;
  bolIsActive: boolean;
  strGroupGUID: string;
  strCreatedByGUID: string;
  strCreatedBy?: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedBy?: string | null;
  dtUpdatedOn?: string | null;
}

export type PicklistValueListResponse = ApiResponse<PagedResponse<PicklistValue>>;

export interface PicklistValueParams extends BaseListParams {
  picklistTypeGUIDs?: string | string[];
  createdByGUIDs?: string | string[];
  updatedByGUIDs?: string | string[];
}

export interface PicklistValueCreate {
  strValue: string;
  strPicklistTypeGUID: string;
  bolIsActive: boolean;
}

export type PicklistValueUpdate = PicklistValueCreate;

export interface PicklistValueSimple {
  strGUID: string;
  strValue: string;
  strPicklistTypeGUID: string;
  strPicklistType?: string; 
  bolIsActive: boolean;
}

export interface PicklistValueApiItem {
  strGUID?: string;
  strPickListValueGUID?: string;
  strValue: string;
  strPicklistTypeGUID?: string;
  bolIsActive?: boolean;
}

export interface PicklistValueApiResponse {
  statuscode?: number;
  statusCode?: number;
  message?: string;
  Message?: string;
  data?: PicklistValueApiItem[];
  Data?: PicklistValueApiItem[];
}
