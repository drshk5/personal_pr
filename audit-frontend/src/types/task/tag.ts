import type { BaseListParams } from "@/types";

export interface Tag {
  strTagGUID: string;
  strBoardGUID: string;
  strTagName: string;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  dtUpdatedOn: string;
}

export interface TagSimple {
  strTagGUID: string;
  strBoardGUID: string;
  strTagName: string;
}

export interface TagParams extends BaseListParams {
  strBoardGUID?: string | string[];
  strTagName?: string;
  sortBy?: string;
  ascending?: boolean;
}

export interface TagCreate {
  strBoardGUID: string;
  strTagName: string;
}

export type TagUpdate = TagCreate;

export interface TagListResponse {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: Tag[];
  message: string;
  statusCode: number;
}
