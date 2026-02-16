import type { ApiPagedResponse } from "../common";

export interface Department {
  strDepartmentGUID: string;
  strDepartmentName: string;
  bolsActive: boolean;
  strGroupGUID?: string;
}

export type DepartmentListResponse = ApiPagedResponse<Department>;

export interface DepartmentCreate {
  strDepartmentName: string;
  bolsActive: boolean;
}

export interface DepartmentUpdate {
  strDepartmentName: string;
  bolsActive: boolean;
}

export interface DepartmentSimple {
  strDepartmentGUID: string;
  strDepartmentName: string;
}

export interface DepartmentFilterParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  ascending?: boolean;
  search?: string;
  bolsActive?: boolean;
}

export interface DepartmentExportParams {
  format: "excel" | "csv";
}
