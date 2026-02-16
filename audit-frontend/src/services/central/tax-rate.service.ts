import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  TaxRate,
  TaxRateCreate,
  TaxRateExportParams,
  TaxRateFilterParams,
  TaxRateListResponse,
  TaxRateSimple,
  TaxRateUpdate,
} from "@/types/central/tax-rate";

export const taxRateService = {
  getTaxRates: async (
    params: TaxRateFilterParams = {}
  ): Promise<TaxRateListResponse> => {
    return await ApiService.getWithMeta<TaxRateListResponse>(
      "/TaxRate",
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getTaxRate: async (id: string): Promise<TaxRate> => {
    return await ApiService.get<TaxRate>(`/TaxRate/${id}`);
  },

  createTaxRate: async (taxRate: TaxRateCreate): Promise<TaxRate> => {
    return await ApiService.post<TaxRate>("/TaxRate", taxRate);
  },

  updateTaxRate: async (
    id: string,
    taxRate: TaxRateUpdate
  ): Promise<TaxRate> => {
    return await ApiService.put<TaxRate>(`/TaxRate/${id}`, taxRate);
  },

  deleteTaxRate: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/TaxRate/${id}`);
    return true;
  },

  getActiveTaxRates: async (
    strTaxTypeGUID: string,
    search?: string
  ): Promise<TaxRateSimple[]> => {
    const params: Record<string, string> = {
      strTaxTypeGUID: strTaxTypeGUID,
    };
    if (search) params.search = search;
    return await ApiService.get<TaxRateSimple[]>("/TaxRate/active", params);
  },

  exportTaxRates: async (params: TaxRateExportParams): Promise<Blob> => {
    return await ApiService.exportFile("/TaxRate/export", {}, params.format);
  },
};
