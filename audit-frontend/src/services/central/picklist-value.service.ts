import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { api } from "@/lib/api/axios";
import type {
  PicklistValue,
  PicklistValueApiResponse,
  PicklistValueCreate,
  PicklistValueListResponse,
  PicklistValueParams,
  PicklistValueSimple,
  PicklistValueUpdate,
} from "@/types/central/picklist-value";

export const picklistValueService = {
  getPicklistValues: async (
    params: PicklistValueParams = {}
  ): Promise<PicklistValueListResponse> => {
    return await ApiService.getWithMeta<PicklistValueListResponse>(
      "/PicklistValue",
      formatPaginationParams({
        ...params,
        picklistTypeGUIDs: params.picklistTypeGUIDs,
        createdByGUIDs: params.createdByGUIDs,
        updatedByGUIDs: params.updatedByGUIDs,
        sortBy: params.sortBy || "strValue",
      })
    );
  },

  getPicklistValue: async (id: string): Promise<PicklistValue> => {
    return await ApiService.get<PicklistValue>(`/PicklistValue/${id}`);
  },

  createPicklistValue: async (
    picklistValue: PicklistValueCreate
  ): Promise<PicklistValue> => {
    return await ApiService.post<PicklistValue>(
      "/PicklistValue",
      picklistValue
    );
  },

  updatePicklistValue: async (
    id: string,
    picklistValue: PicklistValueUpdate
  ): Promise<PicklistValue> => {
    return await ApiService.put<PicklistValue>(
      `/PicklistValue/${id}`,
      picklistValue
    );
  },

  deletePicklistValue: async (id: string): Promise<void> => {
    return await ApiService.delete(`/PicklistValue/${id}`);
  },

  getActivePicklistValuesByType: async (
    strType: string,
    search?: string
  ): Promise<PicklistValueSimple[]> => {
    try {
      const response = await api.get<PicklistValueApiResponse>(
        `/PicklistValue/active-by-type/${encodeURIComponent(strType)}`,
        {
          params: {
            search: search || undefined,
          },
        }
      );
      let responseData = response.data?.data;

      if (!responseData && response.data?.Data) {
        responseData = response.data.Data;
      }
      if (!responseData) {
        return [];
      }

      if (!Array.isArray(responseData)) {
        return [];
      }

      const validItems = responseData
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            (item.strGUID || item.strPickListValueGUID) &&
            item.strValue
        )
        .map((item) => ({
          strGUID: (item.strGUID || item.strPickListValueGUID) as string,
          strValue: item.strValue,
          strPicklistTypeGUID: item.strPicklistTypeGUID || "",
          bolIsActive: item.bolIsActive !== false,
        }));

      return validItems;
    } catch {
      return [];
    }
  },

  exportPicklistValues: async (params: {
    picklistTypeGUIDs?: string | string[];
    bolIsActive?: boolean;
    search?: string;
    sortBy?: string;
    ascending?: boolean;
    format?: "excel" | "csv";
  }): Promise<Blob> => {
    const picklistTypeGUIDsParam = Array.isArray(params.picklistTypeGUIDs)
      ? params.picklistTypeGUIDs.join(",")
      : params.picklistTypeGUIDs;

    return ApiService.exportFile("/PicklistValue/Export", {
      picklistTypeGUIDs: picklistTypeGUIDsParam,
      bolIsActive: params.bolIsActive,
      search: params.search,
      sortBy: params.sortBy || "strValue",
      ascending: params.ascending === undefined ? true : params.ascending,
      format: params.format || "excel",
    });
  },
};
