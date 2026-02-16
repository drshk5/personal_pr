import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  TaxCategory,
  TaxCategoryCreate,
  TaxCategoryExportParams,
  TaxCategoryFilterParams,
  TaxCategoryListResponse,
  TaxCategorySimple,
  TaxCategoryUpdate,
} from "@/types/central/tax-category";

export const taxCategoryService = {
  getTaxCategories: async (
    params: TaxCategoryFilterParams = {}
  ): Promise<TaxCategoryListResponse> => {
    return await ApiService.getWithMeta<TaxCategoryListResponse>(
      "/TaxCategory",
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getTaxCategory: async (id: string): Promise<TaxCategory> => {
    return await ApiService.get<TaxCategory>(`/TaxCategory/${id}`);
  },

  createTaxCategory: async (
    taxCategory: TaxCategoryCreate
  ): Promise<TaxCategory> => {
    return await ApiService.post<TaxCategory>("/TaxCategory", taxCategory);
  },

  updateTaxCategory: async (
    id: string,
    taxCategory: TaxCategoryUpdate
  ): Promise<TaxCategory> => {
    return await ApiService.put<TaxCategory>(`/TaxCategory/${id}`, taxCategory);
  },

  deleteTaxCategory: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/TaxCategory/${id}`);
    return true;
  },

  getActiveTaxCategories: async (
    strTaxTypeGUID: string,
    search?: string
  ): Promise<TaxCategorySimple[]> => {
    const params: Record<string, string> = {
      strTaxTypeGUID: strTaxTypeGUID,
    };
    if (search) params.search = search;
    return await ApiService.get<TaxCategorySimple[]>(
      "/TaxCategory/active",
      params
    );
  },

  exportTaxCategories: async (
    params: TaxCategoryExportParams
  ): Promise<Blob> => {
    return await ApiService.exportFilePost(
      `/TaxCategory/export/${params.format}`,
      (params.filters || {}) as Record<string, unknown>
    );
  },
};
