import type { ApiPagedResponse, BaseListParams } from "@/types";

export interface PageTemplate {
  strPageTemplateGUID: string;
  strPageTemplateName: string;
  bolIsSave: boolean;
  bolIsView: boolean;
  bolIsEdit: boolean;
  bolIsDelete: boolean;
  bolIsPrint: boolean;
  bolIsExport: boolean;
  bolIsImport: boolean;
  bolIsApprove: boolean;
  strOrganizationGUID: string;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn: string;
}

export interface PageTemplateSimple {
  strPageTemplateGUID: string;
  strPageTemplateName: string;
}

export interface PageTemplateParams extends BaseListParams {
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
}

export interface PageTemplateCreate {
  strPageTemplateName: string;
  bolIsSave: boolean;
  bolIsView: boolean;
  bolIsEdit: boolean;
  bolIsDelete: boolean;
  bolIsPrint: boolean;
  bolIsExport: boolean;
  bolIsImport: boolean;
  bolIsApprove: boolean;
}

export type PageTemplateUpdate = PageTemplateCreate;

export type PageTemplateListResponse = ApiPagedResponse<PageTemplate>;
