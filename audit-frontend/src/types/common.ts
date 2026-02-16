export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
  errors?: unknown | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export type ApiPagedResponse<T> = ApiResponse<PagedResponse<T>>;

export interface BackendPagedResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  errors?: string[] | null;
}

export interface BaseListParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  ascending?: boolean;
  bolIsActive?: boolean;
}

export interface DocumentFile {
  strDocumentGUID: string;
  strDocumentAssociationGUID: string;
  strFileName: string;
  strFileType?: string | null;
  strFileSize?: string | null;
}

export interface AttachmentFile {
  strDocumentAssociationGUID: string;
  strFileName: string;
  strFileType: string;
  strFileSize: string;
  strFilePath?: string;
}

export interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
      Message?: string;
      errors?: Record<string, unknown>;
      title?: string;
      type?: string;
      traceId?: string;
      status?: number;
      detail?: string;
      statuscode?: number;
      statusCode?: number;
    };
  };
  statuscode?: number;
  statusCode?: number;
  message?: string;
  Message?: string;
  errors?: Record<string, unknown>;
  apiError?: {
    message?: string;
    errors?: Record<string, unknown>;
    statuscode?: number;
    [key: string]: unknown;
  };
}
