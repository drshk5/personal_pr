import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Document,
  DocumentListResponse,
  DocumentParams,
  DocumentUpdate,
  DocumentUploadRequest,
  DocumentBulkChangeDeleteStatusDto,
  DocumentBulkMoveToFolderDto,
  DocumentBulkAssignDto,
  BulkOperationResult,
} from "@/types";

export const documentService = {
  getDocuments: async (
    params: DocumentParams = {}
  ): Promise<DocumentListResponse> => {
    return await ApiService.getWithMeta<DocumentListResponse>(
      "/Document",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strFileName",
      })
    );
  },

  getDocument: async (id: string): Promise<Document> => {
    const response = await ApiService.get<Document>(`/Document/${id}`);
    return response;
  },

  uploadDocuments: async (data: DocumentUploadRequest): Promise<Document[]> => {
    const formData = new FormData();

    data.files.forEach((file) => {
      formData.append("Files", file);
    });
    if (data.strFolderGUID) {
      formData.append("strFolderGUID", data.strFolderGUID);
    }

    if (data.strEntityGUID) {
      formData.append("strEntityGUID", data.strEntityGUID);
    }

    if (data.strEntityName) {
      formData.append("strEntityName", data.strEntityName);
    }

    if (data.strEntityValue) {
      formData.append("strEntityValue", data.strEntityValue);
    }

    if (data.strURL) {
      formData.append("strURL", data.strURL);
    }

    return await ApiService.post<Document[]>("/Document", formData);
  },

  updateDocument: async (
    id: string,
    data: DocumentUpdate
  ): Promise<Document> => {
    return await ApiService.put<Document>(`/Document/${id}`, data);
  },

  deleteDocument: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/Document/${id}`);
    return true;
  },

  bulkDeleteDocuments: async (ids: string[]): Promise<boolean> => {
    // Use axios directly from api since ApiService doesn't have a delete with body method
    const { api } = await import("@/lib/api/axios");
    await api.delete("/Document/bulk", {
      data: {
        strDocumentGUIDs: ids,
      },
    });
    return true;
  },

  bulkChangeDeleteStatus: async (
    data: DocumentBulkChangeDeleteStatusDto
  ): Promise<{
    statusCode: number;
    message: string;
    details?: BulkOperationResult;
  }> => {
    const response = await ApiService.postWithMeta<{
      statusCode: number;
      message: string;
      details?: BulkOperationResult;
    }>("/Document/bulkChangeDeleteStatus", data);
    return response;
  },

  bulkSoftDelete: async (ids: string[]): Promise<boolean> => {
    await ApiService.post<void>("/Document/bulkSoftDelete", {
      strDocumentGUIDs: ids,
    });
    return true;
  },

  bulkMoveToFolder: async (
    data: DocumentBulkMoveToFolderDto
  ): Promise<boolean> => {
    await ApiService.post<void>("/Document/bulkMoveFileToFolder", data);
    return true;
  },

  bulkAssign: async (
    data: DocumentBulkAssignDto
  ): Promise<{
    statusCode: number;
    message: string;
    details?: BulkOperationResult;
  }> => {
    const response = await ApiService.postWithMeta<{
      statusCode: number;
      message: string;
      details?: BulkOperationResult;
    }>("/Document/bulkAssign", data);
    return response;
  },
};
