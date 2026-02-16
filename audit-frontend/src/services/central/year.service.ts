import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Year,
  YearCreate,
  YearParams,
  YearUpdate,
  YearSimple,
  YearListResponse,
} from "@/types/central/year";

export const yearService = {
  getYears: async (params: YearParams = {}): Promise<YearListResponse> => {
    return await ApiService.getWithMeta<YearListResponse>(
      "/Year",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strName",
        ascending: params.ascending === undefined ? true : params.ascending,
      })
    );
  },

  getYear: async (id: string): Promise<Year> => {
    return await ApiService.get<Year>(`/Year/${id}`);
  },

  getYearsByOrganization: async (
    organizationId: string
  ): Promise<YearSimple[]> => {
    return await ApiService.get<YearSimple[]>(
      `/Year/organization/${organizationId}`
    );
  },

  createYear: async (year: YearCreate): Promise<Year> => {
    return await ApiService.post<Year>("/Year", year);
  },

  updateYear: async (id: string, year: YearUpdate): Promise<Year> => {
    return await ApiService.put<Year>(`/Year/${id}`, year);
  },

  deleteYear: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/Year/${id}`);
    return true;
  },

  getActiveYearsByOrganization: async (
    organizationId: string,
    excludeYearId?: string
  ): Promise<YearSimple[]> => {
    const params: Record<string, string> = {
      strOrganizationGUID: organizationId,
    };

    if (excludeYearId) {
      params.strYearGUID = excludeYearId;
    }

    return await ApiService.get<YearSimple[]>("/Year/active-years", params);
  },

  getYearsByOrganizationAndUser: async (
    organizationId: string
  ): Promise<YearSimple[]> => {
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/auth/")) {
        return [];
      }
    }

    return await ApiService.get<YearSimple[]>(
      `/Year/organization/${organizationId}`
    );
  },

  exportYears: async (params: { format: "excel" | "csv" }): Promise<Blob> => {
    return await ApiService.exportFile("/Year/export", {
      format: params.format,
    });
  },
};
