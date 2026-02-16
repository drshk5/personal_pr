import type { ApiPagedResponse } from "../common";

export interface Designation {
  strDesignationGUID: string;
  strName: string;
  bolIsActive: boolean;
}

export type DesignationListResponse = ApiPagedResponse<Designation>;

export interface DesignationCreate {
  strName: string;
  bolIsActive: boolean;
}

export interface DesignationUpdate {
  strName: string;
  bolIsActive: boolean;
}

export interface DesignationSimple {
  strDesignationGUID: string;
  strName: string;
}

export interface DesignationFilterParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  ascending?: boolean;
  search?: string;
  bolIsActive?: boolean;
}

export interface DesignationExportParams {
  format: "excel" | "csv";
}
