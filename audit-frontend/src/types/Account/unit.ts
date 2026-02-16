import type { BaseListParams } from "@/types";

export interface Unit {
  strUnitGUID: string;
  strUnitName: string;
  bolIsActive: boolean;
  strOrganizationGUID: string;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn?: string | null;
}

export type UnitSimple = Omit<Unit, "strCreatedByName" | "strUpdatedByName">;

export interface UnitParams extends BaseListParams {
  bolIsActive?: boolean;
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
}

export interface UnitCreate {
  strUnitName: string;
  bolIsActive?: boolean;
}

export interface UnitUpdate {
  strUnitName: string;
  bolIsActive: boolean;
}

export interface UnitListResponse {
  statusCode: number;
  message: string;
  data: Unit[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
