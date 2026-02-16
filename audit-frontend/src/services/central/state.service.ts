import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  State,
  StateCreate,
  StateExportParams,
  StateListResponse,
  StateParams,
  StateSimple,
  StateUpdate,
} from "@/types/central/state";

export const stateService = {
  getStates: async (params: StateParams = {}): Promise<StateListResponse> => {
    return await ApiService.getWithMeta<StateListResponse>(
      "/State",
      formatPaginationParams({
        ...params,
        strCountryGUIDs: params.strCountryGUIDs,
        strCountryGUID: params.strCountryGUID,
        bolIsActive: params.bolIsActive,
        sortBy: params.sortBy || "strName",
      })
    );
  },

  getState: async (id: string): Promise<State> => {
    return await ApiService.get<State>(`/State/${id}`);
  },

  createState: async (state: StateCreate): Promise<State> => {
    return await ApiService.post<State>("/State", state);
  },

  updateState: async (id: string, state: StateUpdate): Promise<State> => {
    return await ApiService.put<State>(`/State/${id}`, state);
  },

  getStatesByCountry: async (
    countryId: string,
    search?: string
  ): Promise<StateSimple[]> => {
    return await ApiService.get<StateSimple[]>(
      `/State/by-country/${countryId}`,
      {
        search: search,
      }
    );
  },

  deleteState: async (id: string): Promise<void> => {
    return await ApiService.delete(`/State/${id}`);
  },

  getActiveStates: async (search?: string): Promise<StateSimple[]> => {
    return await ApiService.get<StateSimple[]>("/State/active", {
      search: search,
    });
  },

  importStates: async (
    file: File
  ): Promise<{
    SuccessCount: number;
    FailureCount: number;
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    return await ApiService.post<{
      SuccessCount: number;
      FailureCount: number;
    }>("/State/import", formData);
  },

  exportStates: async (params: StateExportParams): Promise<Blob> => {
    return await ApiService.exportFile("/State/export", {}, params.format);
  },
};
