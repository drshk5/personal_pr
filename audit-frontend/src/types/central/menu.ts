export interface Menu {
  strMenuGUID: string;
  strParentMenuGUID?: string;
  strParentMenuName?: string;
  dblSeqNo: number;
  strName: string;
  strPath: string;
  strMenuPosition: string;
  strMapKey: string;
  bolHasSubMenu: boolean;
  strIconName?: string;
  bolIsActive: boolean;
  bolSuperAdminAccess: boolean;
}

export interface MenuPage {
  strMenuGUID: string;
  strName: string;
  strPath: string;
  strMapKey: string;
  strIconName: string;
  dblSeqNo: number;
  strMenuPosition: string;
  strParentMenuGUID?: string;
  permission?: {
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
  };
}

export interface MenuCreate {
  strParentMenuGUID?: string;
  dblSeqNo: number;
  strName: string;
  strPath: string;
  strMenuPosition: string;
  strMapKey: string;
  bolHasSubMenu: boolean;
  strIconName?: string;
  bolIsActive: boolean;
  bolSuperAdminAccess: boolean;
}

export type MenuUpdate = MenuCreate;

export interface MenuExportParams {
  format: "excel" | "csv";
}

export interface MenuRightsBatch {
  strMasterMenuGUID: string;
  strParentMenuGUID?: string | null;
  strModuleGUID?: string | null;
  dblSeqNo: number;
  strName: string;
  strPath: string;
  strMenuPosition: string;
  strMapKey: string;
  bolHasSubMenu: boolean;
  strIconName?: string | null;
  bolIsActive: boolean;
  strGroupGUID: string;
  strMenuGUID?: string | null;
  hasMenuRights: boolean;
  bolRightGiven: boolean;
  children?: MenuRightsBatch[];
}

export interface MenuRightsBatchRequest {
  Items: MenuRightsBatch[];
}
