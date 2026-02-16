import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type { BaseListParams } from "@/types";
import type {
  PicklistType,
  PicklistTypeCreate,
  PicklistTypeExportParams,
  PicklistTypeListResponse,
  PicklistTypeSimple,
  PicklistTypeUpdate,
} from "@/types/central/picklist-type";

export const picklistTypeService = {
  getPicklistTypes: async (
    params: BaseListParams = {}
  ): Promise<PicklistTypeListResponse> => {
    return await ApiService.getWithMeta<PicklistTypeListResponse>(
      "/PicklistType",
      formatPaginationParams({
        ...params,
      })
    );
  },

  getPicklistType: async (id: string): Promise<PicklistType> => {
    return await ApiService.get<PicklistType>(`/PicklistType/${id}`);
  },

  createPicklistType: async (
    picklistType: PicklistTypeCreate
  ): Promise<PicklistType> => {
    return await ApiService.post<PicklistType>("/PicklistType", picklistType);
  },

  updatePicklistType: async (
    id: string,
    picklistType: PicklistTypeUpdate
  ): Promise<PicklistType> => {
    return await ApiService.put<PicklistType>(
      `/PicklistType/${id}`,
      picklistType
    );
  },

  deletePicklistType: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/PicklistType/${id}`);
    return true;
  },

  getActivePicklistTypes: async (
    search?: string
  ): Promise<PicklistTypeSimple[]> => {
    return await ApiService.get<PicklistTypeSimple[]>("/PicklistType/active", {
      search: search,
    });
  },

  exportPicklistTypes: async (
    params: PicklistTypeExportParams
  ): Promise<Blob> => {
    return await ApiService.exportFile(
      "/PicklistType/export",
      {},
      params.format
    );
  },
};
