import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type { BaseListParams } from "@/types";
import type {
  CurrencyType,
  CurrencyTypeCreate,
  CurrencyTypeExportParams,
  CurrencyTypeListResponse,
  CurrencyTypeSimple,
  CurrencyTypeUpdate,
} from "@/types/central/currency-type";

export const currencyTypeService = {
  getCurrencyTypes: async (
    params: BaseListParams = {}
  ): Promise<CurrencyTypeListResponse> => {
    return await ApiService.getWithMeta<CurrencyTypeListResponse>(
      "/CurrencyType",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strName",
      })
    );
  },

  getCurrencyType: async (id: string): Promise<CurrencyType> => {
    return await ApiService.get<CurrencyType>(`/CurrencyType/${id}`);
  },

  createCurrencyType: async (
    currencyType: CurrencyTypeCreate
  ): Promise<CurrencyType> => {
    return await ApiService.post<CurrencyType>("/CurrencyType", currencyType);
  },

  updateCurrencyType: async (
    id: string,
    currencyType: CurrencyTypeUpdate
  ): Promise<CurrencyType> => {
    return await ApiService.put<CurrencyType>(
      `/CurrencyType/${id}`,
      currencyType
    );
  },

  getActiveCurrencyTypes: async (
    search?: string
  ): Promise<CurrencyTypeSimple[]> => {
    return await ApiService.get<CurrencyTypeSimple[]>(
      "/CurrencyType/active",
      search ? { search } : undefined
    );
  },

  deleteCurrencyType: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/CurrencyType/${id}`);
    return true;
  },

  exportCurrencyTypes: async (
    params: CurrencyTypeExportParams
  ): Promise<Blob> => {
    return await ApiService.exportFile(
      "/CurrencyType/export",
      {},
      params.format
    );
  },
};
