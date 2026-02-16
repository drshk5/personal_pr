import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  PageTemplate,
  PageTemplateCreate,
  PageTemplateListResponse,
  PageTemplateParams,
  PageTemplateSimple,
  PageTemplateUpdate,
} from "@/types/central/page-template";

export const pageTemplateService = {
  getPageTemplates: async (
    params: PageTemplateParams = {}
  ): Promise<PageTemplateListResponse> => {
    return await ApiService.getWithMeta<PageTemplateListResponse>(
      "/PageTemplate",
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getPageTemplate: async (id: string): Promise<PageTemplate> => {
    return await ApiService.get<PageTemplate>(`/PageTemplate/${id}`);
  },

  createPageTemplate: async (
    pageTemplate: PageTemplateCreate
  ): Promise<PageTemplate> => {
    return await ApiService.post<PageTemplate>("/PageTemplate", pageTemplate);
  },

  updatePageTemplate: async (
    id: string,
    pageTemplate: PageTemplateUpdate
  ): Promise<PageTemplate> => {
    return await ApiService.put<PageTemplate>(
      `/PageTemplate/${id}`,
      pageTemplate
    );
  },

  getActivePageTemplates: async (
    search?: string
  ): Promise<PageTemplateSimple[]> => {
    return await ApiService.get<PageTemplateSimple[]>("/PageTemplate/active", {
      search: search || undefined,
    });
  },

  deletePageTemplate: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/PageTemplate/${id}`);
    return true;
  },

  exportPageTemplates: async (format: "excel" | "csv"): Promise<Blob> => {
    return await ApiService.exportFile("/PageTemplate/export", {}, format);
  },
};
