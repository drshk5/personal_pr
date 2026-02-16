import type { ApiResponse, BaseListParams, PagedResponse } from "@/types";

export interface DocType {
  strDocTypeGUID: string;
  strDocTypeCode: string;
  strDocTypeName: string;
  bolIsActive: boolean;
  dtCreatedOn: string;
  dtUpdatedOn?: string;
}

export type DocTypeListResponse = ApiResponse<PagedResponse<DocType>>;

export interface DocTypeParams extends BaseListParams {
  bolIsActive?: boolean;
}

export interface DocTypeCreate {
  strDocTypeCode: string;
  strDocTypeName: string;
  bolIsActive: boolean;
}

export interface DocTypeUpdate {
  strDocTypeCode: string;
  strDocTypeName: string;
  bolIsActive: boolean;
}

export interface DocTypeSimple {
  strDocTypeGUID: string;
  strDocTypeCode: string;
  strDocTypeName: string;
}
