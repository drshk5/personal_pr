import type { ApiResponse, PagedResponse } from "../common";

export interface Module {
  strModuleGUID: string;
  strName: string;
  strDesc: string;
  strSQlfilePath: string;
  strImagePath: string;
  bolIsActive: boolean;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  dtUpdatedOn?: string;
}

export interface ModuleSelectionRequest {
  strModuleGUID: string;
}

export interface ModuleSelectionResponse {
  statusCode: number;
  message: string;
  data: {
    strUserGUID: string;
    strEmailId: string;
    strName: string | null;
    strGroupGUID: string;
    strModuleGUID: string;
    strOrganizationGUID: string;
    strYearGUID: string;
    strRoleGUID: string;
    token?: string;
  };
}

export type ModuleListResponse = ApiResponse<PagedResponse<Module>>;

export interface ModuleExportParams {
  format: "excel" | "csv";
}

export interface ModuleCreate {
  strName: string;
  strDesc: string;
  strSQlfilePath: string;
  strImagePath?: string;
  bolIsActive: boolean;
  ImageFile?: File;
}

export type ModuleUpdate = ModuleCreate;

export interface ModuleSimple {
  strModuleGUID: string;
  strName: string;
  strDesc: string;
  strImagePath: string;
}

export interface UserModule {
  strModuleGUID: string;
  strModuleName: string;
  strDesc: string;
  strImagePath: string;
}

export interface UserModuleResponse {
  statusCode: number;
  message: string;
  data: UserModule[];
}
