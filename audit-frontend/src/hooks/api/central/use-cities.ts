import {
  useMutation,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { cityService } from "@/services/central/city.service";
import type {
  CityCreate,
  CityExportParams,
  CityParams,
  CityUpdate,
  CitySimple,
} from "@/types/central/city";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const cityQueryKeys = createQueryKeys("cities");

export const useCities = (params?: CityParams) => {
  return useQuery({
    queryKey: cityQueryKeys.list(params || {}),
    queryFn: () => cityService.getCities(params),
  });
};

export const useCity = (id?: string) => {
  return useQuery({
    queryKey: cityQueryKeys.detail(id || ""),
    queryFn: () => cityService.getCity(id!),
    enabled: !!id,
  });
};

export const useCreateCity = () => {
  return useMutation({
    mutationFn: (city: CityCreate) => cityService.createCity(city),
    onSuccess: () => {
      toast.success("City created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create city"),
  });
};

export const useUpdateCity = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CityUpdate }) =>
      cityService.updateCity(id, data),
    onSuccess: () => {
      toast.success("City updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update city"),
  });
};

export const useDeleteCity = () => {
  return useMutation({
    mutationFn: (id: string) => cityService.deleteCity(id),
    onSuccess: () => {
      toast.success("City deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete city"),
  });
};

export const useCitiesByCountryAndState = (
  countryId?: string,
  stateId?: string,
  search?: string,
  options?: Partial<UseQueryOptions<CitySimple[]>>
) => {
  return useQuery<CitySimple[]>({
    queryKey: [
      ...cityQueryKeys.all,
      "by-country-and-state",
      countryId,
      stateId,
      search,
    ],
    queryFn: () =>
      countryId && stateId
        ? cityService.getCitiesByCountryAndState(countryId, stateId, search)
        : Promise.resolve([]),
    enabled: (options?.enabled ?? true) && !!(countryId && stateId),
    ...options,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  });
};

export const useActiveCities = (stateId?: string) => {
  return useQuery({
    queryKey: stateId
      ? [...cityQueryKeys.all, "active", stateId]
      : [...cityQueryKeys.all, "active"],
    queryFn: () => cityService.getActiveCitiesByState(stateId!),
    enabled: !!stateId,
  });
};

export const useExportCities = () => {
  return useMutation({
    mutationFn: (params: CityExportParams) => cityService.exportCities(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `cities_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Cities exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error) => handleMutationError(error, "Failed to export cities"),
  });
};

export const useImportCities = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      return cityService.importCities(file);
    },
    onSuccess: (response) => {
      toast.success(response.message);

      const result = response.data;

      if (result.missingLocations?.length > 0) {
        const missingLocationsList = result.missingLocations
          .map((loc) => `${loc.countryName} > ${loc.stateName}`)
          .join("\n");

        toast.error(
          `The following locations were not found:\n${missingLocationsList}`
        );
      }

      if (result.errorMessages?.length > 0) {
        const errorList = result.errorMessages.join("\n");
        toast.error(`Import Errors:\n${errorList}`);
      }
    },
    onError: (error) => handleMutationError(error, "Failed to import cities"),
  });
};
