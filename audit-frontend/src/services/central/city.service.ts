import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { api } from "@/lib/api/axios";
import type {
  City,
  CityCreate,
  CityExportParams,
  CityListResponse,
  CityParams,
  CitySimple,
  CityUpdate,
  ImportCityResult,
} from "@/types/central/city";

export const cityService = {
  importCities: async (
    file: File
  ): Promise<{ data: ImportCityResult; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/City/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return {
      data: response.data.data,
      message: response.data.message,
    };
  },
  getCities: async (params: CityParams = {}): Promise<CityListResponse> => {
    return await ApiService.getWithMeta<CityListResponse>(
      "/City",
      formatPaginationParams({
        ...params,
        strCountryGUID: params.strCountryGUID,
        strStateGUID: params.strStateGUID,
        sortBy: params.sortBy || "strName",
      })
    );
  },

  getCity: async (id: string): Promise<City> => {
    return await ApiService.get<City>(`/City/${id}`);
  },

  createCity: async (city: CityCreate): Promise<City> => {
    return await ApiService.post<City>("/City", city);
  },

  updateCity: async (id: string, city: CityUpdate): Promise<City> => {
    return await ApiService.put<City>(`/City/${id}`, city);
  },

  getCitiesByCountryAndState: async (
    countryGuid: string,
    stateGuid: string,
    search?: string
  ): Promise<CitySimple[]> => {
    return await ApiService.get<CitySimple[]>("/City/by-country-and-state", {
      countryGuid,
      stateGuid,
      search: search || undefined,
    });
  },

  getActiveCitiesByState: async (stateGuid: string): Promise<CitySimple[]> => {
    return await ApiService.get<CitySimple[]>("/City/active", {
      stateGuid,
    });
  },

  deleteCity: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/City/${id}`);
    return true;
  },

  exportCities: async (params: CityExportParams): Promise<Blob> => {
    return await ApiService.exportFile("/City/export", {}, params.format);
  },
};
