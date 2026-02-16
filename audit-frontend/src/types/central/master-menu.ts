import type { ApiResponse, BaseListParams, PagedResponse } from "@/types";

export interface MasterMenu {
  strMasterMenuGUID: string;
  strParentMenuGUID?: string;
  strParentMenuName?: string;
  strModuleGUID?: string;
  dblSeqNo: number;
  strName: string;
  strPath: string;
  strMenuPosition: string;
  strMapKey: string;
  bolHasSubMenu: boolean;
  strIconName?: string;
  bolIsActive: boolean;
  bolSuperAdminAccess: boolean;
  strCategory?: string;
  strPageTemplateGUID?: string;
  strPageTemplateName?: string;
  bolIsSingleMenu: boolean;
}

export interface MasterMenuParent {
  strMasterMenuGUID: string;
  strName: string;
  strPath: string;
  strMenuPosition: string;
  dblSeqNo: number;
}

export interface MasterMenuParams extends BaseListParams {
  strParentMenuGUID?: string;
  strPosition?: string;
  strCategory?: string;
  strPageTemplateGUID?: string;
  bolIsSuperadmin?: boolean;
}

export interface MasterMenuCreate {
  strParentMenuGUID?: string;
  strModuleGUID?: string;
  dblSeqNo: number;
  strName: string;
  strPath: string;
  strMenuPosition: string;
  strMapKey: string;
  bolHasSubMenu: boolean;
  strIconName?: string;
  bolIsActive: boolean;
  bolSuperAdminAccess: boolean;
  strCategory?: string;
  strPageTemplateGUID?: string;
  bolIsSingleMenu: boolean;
}

export type MasterMenuUpdate = MasterMenuCreate;

export type MasterMenuListResponse = ApiResponse<PagedResponse<MasterMenu>>;

export interface MasterMenuExportParams {
  format: "excel" | "csv";
}

export interface MasterMenuGroupModuleItem {
  strMasterMenuGUID: string;
  strParentMenuGUID?: string;
  strModuleGUID?: string;
  dblSeqNo: number;
  strName: string;
  strPath: string;
  strMenuPosition: string;
  strMapKey: string;
  bolHasSubMenu: boolean;
  strIconName?: string;
  bolIsActive: boolean;
  bolIsSingleMenu: boolean;
  strGroupGUID: string;
  strMenuGUID?: string;
  hasMenuRights: boolean;
  bolRightGiven: boolean;
  strCategory?: string;
  strPageTemplateGUID?: string;
  children: MasterMenuGroupModuleItem[];
}

export interface MasterMenuGroupModuleResponse {
  items: MasterMenuGroupModuleItem[];
  totalCount: number;
}

export type MasterMenuGroupModule = ApiResponse<MasterMenuGroupModuleResponse>;

export interface MenusByGroupModuleParams {
  strGroupGUID: string;
  strModuleGUID: string;
}
