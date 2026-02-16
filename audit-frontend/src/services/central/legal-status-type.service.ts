import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type { BaseListParams } from "@/types";
import type {
  LegalStatusType,
  LegalStatusTypeCreate,
  LegalStatusTypeExportParams,
  LegalStatusTypeListResponse,
  LegalStatusTypeSimple,
  LegalStatusTypeUpdate,
} from "@/types/central/legal-status-type";

export const legalStatusTypeService = {
  getLegalStatusTypes: async (
    params: BaseListParams = {}
  ): Promise<LegalStatusTypeListResponse> => {
    return await ApiService.getWithMeta<LegalStatusTypeListResponse>(
      "/LegalStatusType",
      formatPaginationParams({
        ...params,
      })
    );
  },

  getLegalStatusType: async (id: string): Promise<LegalStatusType> => {
    return await ApiService.get<LegalStatusType>(`/LegalStatusType/${id}`);
  },

  createLegalStatusType: async (
    legalStatusType: LegalStatusTypeCreate
  ): Promise<LegalStatusType> => {
    return await ApiService.post<LegalStatusType>(
      "/LegalStatusType",
      legalStatusType
    );
  },

  updateLegalStatusType: async (
    id: string,
    legalStatusType: LegalStatusTypeUpdate
  ): Promise<LegalStatusType> => {
    return await ApiService.put<LegalStatusType>(
      `/LegalStatusType/${id}`,
      legalStatusType
    );
  },

  deleteLegalStatusType: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/LegalStatusType/${id}`);
    return true;
  },

  getActiveLegalStatusTypes: async (
    search?: string
  ): Promise<LegalStatusTypeSimple[]> => {
    return await ApiService.get<LegalStatusTypeSimple[]>(
      "/LegalStatusType/active",
      {
        search: search,
      }
    );
  },

  exportLegalStatusTypes: async (
    params: LegalStatusTypeExportParams
  ): Promise<Blob> => {
    return await ApiService.exportFile(
      "/LegalStatusType/export",
      {},
      params.format
    );
  },
};
