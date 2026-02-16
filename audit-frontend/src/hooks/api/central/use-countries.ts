import {
  useMutation,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { countryService } from "@/services/central/country.service";
import type {
  CountryCreate,
  CountryExportParams,
  CountryUpdate,
  CountrySimple,
} from "@/types/central/country";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import type { BaseListParams } from "@/types";

export const countryQueryKeys = createQueryKeys("countries");

export const useImportCountries = () => {
  return useMutation({
    mutationFn: (file: File) => countryService.importCountries(file),
    onSuccess: (data) => {
      toast.success(
        `Import completed successfully. ${data.data.SuccessCount} countries imported, ${data.data.FailureCount} countries already exists.`
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to import countries"),
  });
};

export const useCountries = (params?: BaseListParams) => {
  return useQuery({
    queryKey: countryQueryKeys.list(params || {}),
    queryFn: () => countryService.getCountries(params),
  });
};

export const useCountry = (id?: string) => {
  return useQuery({
    queryKey: countryQueryKeys.detail(id || ""),
    queryFn: () => countryService.getCountry(id!),
    enabled: !!id,
  });
};

export const useCreateCountry = () => {
  return useMutation({
    mutationFn: (country: CountryCreate) =>
      countryService.createCountry(country),
    onSuccess: () => {
      toast.success("Country created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create country"),
  });
};

export const useUpdateCountry = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CountryUpdate }) =>
      countryService.updateCountry(id, data),
    onSuccess: () => {
      toast.success("Country updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update country"),
  });
};

export const useDeleteCountry = () => {
  return useMutation({
    mutationFn: (id: string) => countryService.deleteCountry(id),
    onSuccess: () => {
      toast.success("Country deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete country"),
  });
};

export const useActiveCountries = (
  search?: string,
  options?: Partial<UseQueryOptions<CountrySimple[]>>
) => {
  return useQuery<CountrySimple[]>({
    queryKey: search
      ? [...countryQueryKeys.all, "active", search]
      : [...countryQueryKeys.all, "active"],
    queryFn: () => countryService.getActiveCountries(search),
    enabled: true,
    ...options,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useExportCountries = () => {
  return useMutation({
    mutationFn: (params: CountryExportParams) =>
      countryService.exportCountries(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `countries_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Countries exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export countries"),
  });
};

export const useFetchCurrencyByCountry = (countryGuid?: string) => {
  return useQuery({
    queryKey: [...countryQueryKeys.all, "currency", countryGuid],
    queryFn: () => countryService.fetchCurrencyByCountry(countryGuid!),
    enabled: !!countryGuid,
  });
};
