import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface GroupModule {
  strGroupModuleGUID: string;
  strGroupGUID: string;
  strGroupName: string;
  strModuleGUID: string;
  strModuleName: string;
  intVersion: number;
  strConnectionString: string;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID: string | null;
  dtUpdatedOn: string | null;
}

export interface GroupModuleCreate {
  strGroupGUID: string;
  strModuleGUID: string;
  intVersion?: number;
}

export interface GroupModuleUpdate {
  intVersion?: number;
}

export interface GroupModuleParams extends BaseListParams {
  Page?: number;
  strGroupGUID: string;
  strModuleGUID?: string;
  intVersion?: number;
}

export interface GroupModuleSimple {
  strGroupModuleGUID: string;
  strGroupGUID: string;
  strGroupName: string;
  strModuleGUID: string;
  strModuleName: string;
  intVersion: number;
}

export interface ModuleInfo {
  strModuleGUID: string;
  strModuleName: string;
}

export type GroupModuleListResponse = ApiResponse<PagedResponse<GroupModule>>;
export type GroupModuleSimpleListResponse = ApiResponse<PagedResponse<GroupModuleSimple>>;
export type ModuleInfoListResponse = ApiResponse<ModuleInfo[]>;
