import type { BaseListParams, ApiResponse, BackendPagedResponse } from "@/types";

export type BoardSubModuleEntityType = "sub_module";

export interface BoardSubModule {
  strBoardSubModuleGUID: string;
  strBoardGUID: string;
  strBoardSectionGUID: string;
  strName: string;
  bolIsActive: boolean;
  strCreatedByGUID: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID: string | null;
  dtUpdatedOn?: string | null;
  strBoardName?: string;
  strBoardSectionName?: string;
  strCreatedByName?: string;
  strUpdatedByName?: string;
  type: BoardSubModuleEntityType;
}

export interface BoardSubModuleSimple {
  strBoardSubModuleGUID: string;
  strBoardGUID: string;
  strBoardSectionGUID: string;
  strName: string;
  bolIsActive: boolean;
  dtCreatedOn: string;
  dtUpdatedOn?: string | null;
}

export interface BoardSubModuleActive {
  strBoardSubModuleGUID: string;
  strName: string;
}

export interface BoardSubModuleParams extends BaseListParams {
  strBoardSectionGUID?: string;
  bolIsActive?: boolean;
  strBoardSubModuleGUID?: string;
  strBoardGUID?: string;
  strCreatedByGuid?: string;
  strUpdatedByGuid?: string;
}

export interface BoardSubModuleCreate {
  strBoardGUID: string;
  strBoardSectionGUID: string;
  strName: string;
  bolIsActive: boolean;
}

export interface BoardSubModuleUpdate {
  strName: string;
  bolIsActive: boolean;
}

export interface BulkCreateBoardSubModule {
  strBoardGUID: string;
  strBoardSectionGUID: string;
  strSubModuleNames: string;
}

export interface BulkCreateBoardSubModuleResult {
  RequestedCount: number;
  CreatedCount: number;
  SkippedCount: number;
  SkippedNames: string[];
  CreatedSubModules: BoardSubModuleSimple[];
}

export type BoardSubModuleResponse = ApiResponse<BoardSubModule>;
export type BoardSubModuleListResponse = BackendPagedResponse<BoardSubModule[]>;
export type BoardSubModuleCreateResponse = ApiResponse<BoardSubModuleSimple>;
export type BoardSubModuleUpdateResponse = ApiResponse<BoardSubModuleSimple>;
export type BoardSubModuleDeleteResponse = ApiResponse<boolean>;
export type BulkCreateBoardSubModuleResponse = ApiResponse<BulkCreateBoardSubModuleResult>;
