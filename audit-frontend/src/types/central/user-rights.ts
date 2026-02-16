import type { ApiResponse, ApiPagedResponse, BaseListParams } from "@/types";

export interface Permission {
  bolCanView: boolean;
  bolCanEdit: boolean;
  bolCanDelete: boolean;
  bolCanSave: boolean;
  bolCanPrint: boolean;
  bolCanExport: boolean;
  bolCanImport: boolean;
  bolCanApprove: boolean;
  bolIsView: boolean;
  bolIsEdit: boolean;
  bolIsDelete: boolean;
  bolIsSave: boolean;
  bolIsPrint: boolean;
  bolIsExport: boolean;
  bolIsImport: boolean;
  bolIsApprove: boolean;
  [key: string]: boolean;
}

export interface MenuItem {
  strMapKey: string;
  strName: string;
  strPath: string;
  strIconName: string;
  bolHasSubMenu: boolean;
  strMenuPosition: "sidebar" | "userbar" | "hidden";
  dblSeqNo: number;
  permission: Permission;
  children: MenuItem[];
}

export type UserRightsResponse = ApiResponse<MenuItem[]>;

export interface UserRight {
  strUserRightGUID: string;
  strUserRoleGUID: string;
  strMenuGUID: string;
  bolCanView: boolean;
  bolCanEdit: boolean;
  bolCanSave: boolean;
  bolCanDelete: boolean;
  bolCanPrint: boolean;
  bolCanExport: boolean;
  bolCanImport: boolean;
  bolCanApprove: boolean;
  strUserRoleName?: string;
  strMenuName?: string;
  userRoleName?: string;
  menuName?: string;
  MenuName?: string;
}

export interface UserRightsBatchItem {
  strUserRightGUID?: string;
  strUserRoleGUID: string;
  strMenuGUID: string;
  bolCanView: boolean;
  bolCanEdit: boolean;
  bolCanSave: boolean;
  bolCanDelete: boolean;
  bolCanPrint: boolean;
  bolCanExport: boolean;
  bolCanImport: boolean;
  bolCanApprove: boolean;
}

export interface UserRightsBatchRequest {
  userRights: UserRightsBatchItem[];
}

export interface UserRightsBatchResponse {
  processedRights: UserRight[];
  insertedCount: number;
  updatedCount: number;
  errors?: string[];
}

export type UserRightsDataResponse = {
  items?: UserRight[];
  Items?: UserRight[];
  totalRecords?: number;
  totalCount?: number;
  TotalCount?: number;
  pageNumber?: number;
  PageNumber?: number;
  pageSize?: number;
  PageSize?: number;
  totalPages?: number;
  TotalPages?: number;
  hasPrevious?: boolean;
  HasPrevious?: boolean;
  hasNext?: boolean;
  HasNext?: boolean;
};

export interface UserRightsListResponse {
  statusCode: number;
  message: string;
  data: UserRightsDataResponse;
}

export interface UserRightsParams extends BaseListParams {
  strRoleGUID?: string;
}

export interface MenuTree {
  strGUID: string;
  strName: string;
  strPath: string;
  strParentMenuGUID?: string;
  strIconName?: string;
  children?: MenuTree[];
  permissions?: {
    canView: boolean;
    canEdit: boolean;
    canSave: boolean;
    canDelete: boolean;
    canPrint: boolean;
    canExport: boolean;
  };
}

export interface MenuItemInternal {
  strGUID: string;
  strName: string;
  strPath: string;
  strParentMenuGUID?: string;
  strIconName?: string;
}

export interface MenuUserRightsTree {
  strUserRightGUID: string;
  strUserRoleGUID: string;
  strMenuGUID: string;
  bolCanView: boolean;
  bolCanEdit: boolean;
  bolCanSave: boolean;
  bolCanDelete: boolean;
  bolCanPrint: boolean;
  bolCanExport: boolean;
  bolCanImport: boolean;
  bolCanApprove: boolean;
  bolIsView: boolean;
  bolIsEdit: boolean;
  bolIsSave: boolean;
  bolIsDelete: boolean;
  bolIsPrint: boolean;
  bolIsExport: boolean;
  bolIsImport: boolean;
  bolIsApprove: boolean;
  strUserRoleName: string;
  strMenuName: string;
  strCategory: string;
  children: MenuUserRightsTree[];
}

export type UserRightsTreeResponse = ApiPagedResponse<MenuUserRightsTree>;
