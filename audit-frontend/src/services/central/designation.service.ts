import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Designation,
  DesignationCreate,
  DesignationExportParams,
  DesignationFilterParams,
  DesignationListResponse,
  DesignationSimple,
  DesignationUpdate,
} from "@/types/central/designation";

export const designationService = {
  getDesignations: async (
    params: DesignationFilterParams = {}
  ): Promise<DesignationListResponse> => {
    return await ApiService.getWithMeta<DesignationListResponse>(
      "/Designation",
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getDesignation: async (guid: string): Promise<Designation> => {
    return await ApiService.get<Designation>(`/Designation/${guid}`);
  },

  createDesignation: async (
    designation: DesignationCreate
  ): Promise<Designation> => {
    return await ApiService.post<Designation>("/Designation", designation);
  },

  updateDesignation: async (
    guid: string,
    designation: DesignationUpdate
  ): Promise<Designation> => {
    return await ApiService.put<Designation>(
      `/Designation/${guid}`,
      designation
    );
  },

  deleteDesignation: async (guid: string): Promise<void> => {
    await ApiService.delete<void>(`/Designation/${guid}`);
  },

  getActiveDesignations: async (
    search?: string
  ): Promise<DesignationSimple[]> => {
    return await ApiService.get<DesignationSimple[]>("/Designation/active", {
      search: search || undefined,
    });
  },


  exportDesignations: async (
    params: DesignationExportParams
  ): Promise<Blob> => {
    return await ApiService.exportFile(
      "/Designation/export",
      {},
      params.format
    );
  },
};
