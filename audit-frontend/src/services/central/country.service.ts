import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { api } from "@/lib/api/axios";
import type { BaseListParams } from "@/types";
import type {
  Country,
  CountryCreate,
  CountryExportParams,
  CountryImportResponse,
  CountryListResponse,
  CountrySimple,
  CountryUpdate,
  CountryCurrencyResponse,
} from "@/types/central/country";

export const countryService = {
  importCountries: async (file: File): Promise<CountryImportResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/Country/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getCountries: async (
    params: BaseListParams = {}
  ): Promise<CountryListResponse> => {
    return await ApiService.getWithMeta<CountryListResponse>(
      "/Country",
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strName",
      })
    );
  },

  getCountry: async (id: string): Promise<Country> => {
    return await ApiService.get<Country>(`/Country/${id}`);
  },

  createCountry: async (country: CountryCreate): Promise<Country> => {
    return await ApiService.post<Country>("/Country", country);
  },

  updateCountry: async (
    id: string,
    country: CountryUpdate
  ): Promise<Country> => {
    return await ApiService.put<Country>(`/Country/${id}`, country);
  },

  getActiveCountries: async (search?: string): Promise<CountrySimple[]> => {
    return await ApiService.get<CountrySimple[]>("/Country/active", {
      search: search || undefined,
    });
  },

  deleteCountry: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/Country/${id}`);
    return true;
  },

  exportCountries: async (params: CountryExportParams): Promise<Blob> => {
    return await ApiService.exportFile("/Country/export", {}, params.format);
  },

  fetchCurrencyByCountry: async (
    countryGuid: string
  ): Promise<CountryCurrencyResponse> => {
    return await ApiService.get<CountryCurrencyResponse>(
      "/Country/fetchcurrencybycountry",
      {
        strCountryGUID: countryGuid,
      }
    );
  },
};
