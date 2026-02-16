import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  TaxType,
  TaxTypeCreate,
  TaxTypeExportParams,
  TaxTypeFilterParams,
  TaxTypeListResponse,
  TaxTypeSimple,
  TaxTypeUpdate,
} from "@/types/central/tax-type";

export const taxTypeService = {
  getTaxTypes: async (
    params: TaxTypeFilterParams = {}
  ): Promise<TaxTypeListResponse> => {
    return await ApiService.getWithMeta<TaxTypeListResponse>(
      "/TaxType",
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getTaxType: async (id: string): Promise<TaxType> => {
    return await ApiService.get<TaxType>(`/TaxType/${id}`);
  },

  createTaxType: async (taxType: TaxTypeCreate): Promise<TaxType> => {
    return await ApiService.post<TaxType>("/TaxType", taxType);
  },

  updateTaxType: async (
    id: string,
    taxType: TaxTypeUpdate
  ): Promise<TaxType> => {
    return await ApiService.put<TaxType>(`/TaxType/${id}`, taxType);
  },

  deleteTaxType: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/TaxType/${id}`);
    return true;
  },

  getActiveTaxTypes: async (
    search?: string,
    strCountryGUID?: string
  ): Promise<TaxTypeSimple[] | TaxTypeSimple | null> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (strCountryGUID) params.strCountryGUID = strCountryGUID;
    return await ApiService.get<TaxTypeSimple[] | TaxTypeSimple | null>(
      "/TaxType/active",
      params
    );
  },

  exportTaxTypes: async (params: TaxTypeExportParams): Promise<Blob> => {
    return await ApiService.exportFile("/TaxType/export", {}, params.format);
  },
};
