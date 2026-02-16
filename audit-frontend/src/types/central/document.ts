import type { ApiResponse, BaseListParams, PagedResponse } from "@/types";

export interface DocumentAssociation {
  strDocumentAssociationGUID: string;
  strEntityGUID: string;
  strEntityName: string;
  strEntityValue?: string;
  strURL?: string;
}

export interface Document {
  strDocumentGUID: string;
  strFileName: string;
  strFileType?: string;
  strFileSize?: string;
  strStatus?: string;
  strUploadByGUID: string;
  dtUploadedOn: string;
  strFolderGUID?: string;
  strCreatedByGUID: string;
  dtCreatedOn: string;
  strModifiedByGUID?: string;
  strModifiedOn?: string;
  bolIsDeleted: boolean;
  strOrganizationGUID: string;
  strGroupGUID: string;
  strYearGUID?: string;
  strModuleGUID?: string;
  strFilePath?: string;
  strFolderName?: string;
  strUploadedByName?: string;
  strCreatedByName?: string;
  strUpdatedByName?: string;
  AssociatedTo?: DocumentAssociation[];
}

export type DocumentListResponse = ApiResponse<PagedResponse<Document>>;

export interface DocumentParams extends BaseListParams {
  bolIsDeleted?: boolean;
  strFolderGUID?: string;
  strStatus?: string;
  strFileType?: string;
}

export interface DocumentUpdate {
  strFileName: string;
}

export interface DocumentUploadRequest {
  files: File[];
  strFolderGUID?: string;
  strEntityGUID?: string;
  strEntityName?: string;
  strEntityValue?: string;
  strURL?: string;
}

export interface DocumentBulkChangeDeleteStatusDto {
  strDocumentGUIDs: string[];
  bolIsDeleted: boolean;
}

export interface DocumentBulkMoveToFolderDto {
  strDocumentGUIDs: string[];
  strFolderGUID: string;
}

export interface DocumentBulkAssignDto {
  strDocumentGUIDs: string[];
  strEntityGUID: string;
  strEntityName: string;
  strEntityValue?: string;
  strURL?: string;
}

export interface BulkOperationFailure {
  ItemId: string;
  ErrorMessage: string;
}

export interface BulkOperationResult {
  SuccessCount: number;
  FailureCount: number;
  Failures: BulkOperationFailure[];
}
