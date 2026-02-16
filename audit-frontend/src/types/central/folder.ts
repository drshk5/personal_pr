import type { ApiResponse, PagedResponse } from "@/types";

export interface Folder {
  strFolderGUID: string;
  strFolderName: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  strGroupGUID: string;
  strModuleGUID: string;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  dtUpdatedOn?: string;
  strUpdatedByGUID?: string;
  strFolderPath: string;
  intDocumentCount: number;
}

export interface FolderResponse extends Folder {
  strOrganizationName?: string;
  strYearName?: string;
  strCreatedBy?: string;
  strUpdatedBy?: string;
}

export interface FolderCreate {
  strFolderName: string;
}

export interface SimpleFolderUpdate {
  strFolderName: string;
}

export interface FolderUpdate {
  strFolderName: string;
  strYearGUID: string;
}

export interface FolderSimpleResponse {
  strFolderGUID: string;
  strFolderName: string;
  intDocumentCount: number;
}

export type FolderListResponse = ApiResponse<
  PagedResponse<FolderSimpleResponse>
>;
