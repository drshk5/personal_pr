import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type { BaseListParams } from "@/types";
import type {
  Industry,
  IndustryCreate,
  IndustryExportParams,
  IndustryListResponse,
  IndustrySimple,
  IndustryUpdate,
} from "@/types/central/industry";

export const industryService = {
  getIndustries: async (
    params: BaseListParams = {}
  ): Promise<IndustryListResponse> => {
    return await ApiService.getWithMeta<IndustryListResponse>(
      "/Industry",
      formatPaginationParams({
        ...params,
      })
    );
  },

  getIndustry: async (id: string): Promise<Industry> => {
    return await ApiService.get<Industry>(`/Industry/${id}`);
  },

  createIndustry: async (industry: IndustryCreate): Promise<Industry> => {
    return await ApiService.post<Industry>("/Industry", industry);
  },

  updateIndustry: async (
    id: string,
    industry: IndustryUpdate
  ): Promise<Industry> => {
    return await ApiService.put<Industry>(`/Industry/${id}`, industry);
  },

  getActiveIndustries: async (search?: string): Promise<IndustrySimple[]> => {
    return await ApiService.get<IndustrySimple[]>("/Industry/active", {
      search: search,
    });
  },

  deleteIndustry: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/Industry/${id}`);
    return true;
  },

  exportIndustries: async (params: IndustryExportParams): Promise<Blob> => {
    return await ApiService.exportFile("/Industry/export", {}, params.format);
  },
};
