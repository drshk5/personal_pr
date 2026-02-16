import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  DocumentModule,
  DocumentModuleListResponse,
  DocumentModuleParams,
  DocumentModuleCreate,
  DocumentModuleUpdate,
  ActiveDocumentModulesParams,
  ActiveDocumentModulesResponse,
} from "@/types";

export const documentModuleService = {
  getDocumentModules: async (
    params: DocumentModuleParams = {}
  ): Promise<DocumentModuleListResponse> => {
    return await ApiService.getWithMeta<DocumentModuleListResponse>(
      "/DocumentModule",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strDocumentModuleName",
      })
    );
  },

  getDocumentModule: async (id: string): Promise<DocumentModule> => {
    const response = await ApiService.get<DocumentModule>(
      `/DocumentModule/${id}`
    );
    return response;
  },

  createDocumentModule: async (
    data: DocumentModuleCreate
  ): Promise<DocumentModule> => {
    const response = await ApiService.post<DocumentModule>(
      "/DocumentModule",
      data
    );
    return response;
  },

  updateDocumentModule: async (
    id: string,
    data: DocumentModuleUpdate
  ): Promise<DocumentModule> => {
    const response = await ApiService.put<DocumentModule>(
      `/DocumentModule/${id}`,
      data
    );
    return response;
  },

  deleteDocumentModule: async (id: string): Promise<void> => {
    await ApiService.delete(`/DocumentModule/${id}`);
  },

  getActiveDocumentModules: async (
    params: ActiveDocumentModulesParams = {}
  ): Promise<ActiveDocumentModulesResponse> => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.append("search", params.search);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `/DocumentModule/active?${queryString}`
      : "/DocumentModule/active";

    return await ApiService.get<ActiveDocumentModulesResponse>(url);
  },
};
