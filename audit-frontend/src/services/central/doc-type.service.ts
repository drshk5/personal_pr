import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  DocType,
  DocTypeCreate,
  DocTypeListResponse,
  DocTypeParams,
  DocTypeSimple,
  DocTypeUpdate,
} from "@/types/central/doc-type";

export const docTypeService = {
  getDocTypes: async (
    params: DocTypeParams = {}
  ): Promise<DocTypeListResponse> => {
    return await ApiService.getWithMeta<DocTypeListResponse>(
      "/DocType",
      formatPaginationParams({
        ...params,
      })
    );
  },

  getDocType: async (id: string): Promise<DocType> => {
    return await ApiService.get<DocType>(`/DocType/${id}`);
  },

  createDocType: async (docType: DocTypeCreate): Promise<DocType> => {
    return await ApiService.post<DocType>("/DocType", docType);
  },

  updateDocType: async (
    id: string,
    docType: DocTypeUpdate
  ): Promise<DocType> => {
    return await ApiService.put<DocType>(`/DocType/${id}`, docType);
  },

  getActiveDocTypes: async (search?: string): Promise<DocTypeSimple[]> => {
    return await ApiService.get<DocTypeSimple[]>("/DocType/active", {
      search: search || undefined,
    });
  },

  deleteDocType: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/DocType/${id}`);
    return true;
  },
};
