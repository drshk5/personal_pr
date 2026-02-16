import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface Schedule {
  strScheduleGUID: string;
  code: number;
  strScheduleCode: string;
  strRefNo?: string;
  strScheduleName: string;
  strTemplateName?: string;
  strUnderCode?: string;
  strParentScheduleGUID?: string;
  strParentScheduleName?: string;
  dblChartType?: number;
  strDefaultAccountTypeGUID?: string;
  strAccountTypeName?: string;
  bolIsActive: boolean;
  bolIsEditable: boolean;
}

export type ScheduleListResponse = ApiResponse<PagedResponse<Schedule>>;

export interface ScheduleParams extends BaseListParams {
  bolIsEditable?: boolean;
  ParentScheduleGUIDs?: string;
  DefaultAccountTypeGUIDs?: string;
  createdByGUIDs?: string;
  updatedByGUIDs?: string;
}

export interface ScheduleCreate {
  code: number;
  strScheduleCode: string;
  strRefNo?: string;
  strScheduleName: string;
  strTemplateName?: string;
  strUnderCode?: string;
  strParentScheduleGUID?: string;
  dblChartType?: number;
  strDefaultAccountTypeGUID?: string;
  bolIsActive: boolean;
  bolIsEditable: boolean;
}

export type ScheduleUpdate = ScheduleCreate;

export interface ScheduleSimple {
  strScheduleGUID: string;
  strScheduleCode: string;
  strScheduleName: string;
  strScheduleInfo: string;
}

export interface ScheduleExportParams {
  format: "excel" | "csv";
}

export interface ImportScheduleResult {
  importedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: string[];
}

export interface ScheduleTree {
  strScheduleGUID: string;
  strScheduleCode: string;
  strScheduleName: string;
  strScheduleInfo: string;
  type: "label" | "data";
  Children: ScheduleTree[];
}

export interface ScheduleItem {
  strScheduleGUID: string;
  strScheduleCode: string;
  strScheduleName: string;
  strScheduleInfo: string;
  type: "label" | "data";
  Children: ScheduleItem[];
}
