import type { ApiResponse, BaseListParams, PagedResponse } from "../common";

export interface DocumentModule {
  strDocumentModuleGUID: string;
  strModuleGUID: string;
  strModuleName: string;
  strDocumentModuleName: string; // Original name from mstDocumentModule (available in list view)
  bolIsActive: boolean;
}

export type DocumentModuleListResponse = ApiResponse<
  PagedResponse<DocumentModule>
>;

export interface DocumentModuleParams extends BaseListParams {
  search?: string;
  bolIsActive?: boolean;
}

export interface DocumentModuleCreate {
  strModuleGUID: string;
  strModuleName: string;
  bolIsActive: boolean;
}

export interface DocumentModuleUpdate {
  strModuleGUID: string;
  strModuleName: string;
  bolIsActive: boolean;
}

export interface ActiveDocumentModulesParams {
  search?: string;
}

export type ActiveDocumentModulesResponse = ApiResponse<DocumentModule[]>;
