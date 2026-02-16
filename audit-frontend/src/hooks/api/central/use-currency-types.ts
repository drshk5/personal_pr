import { useMutation, useQuery } from "@tanstack/react-query";
import { currencyTypeService } from "@/services/central/currency-type.service";
import type {
  CurrencyTypeCreate,
  CurrencyTypeExportParams,
  CurrencyTypeUpdate,
} from "@/types/central/currency-type";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import type { BaseListParams } from "@/types";

export const currencyTypeQueryKeys = createQueryKeys("currencyTypes");

export const activeCurrencyTypesKey = "currencyTypes";

export const useCurrencyTypes = (params?: BaseListParams) => {
  return useQuery({
    queryKey: currencyTypeQueryKeys.list(params || {}),
    queryFn: () => currencyTypeService.getCurrencyTypes(params),
  });
};

export const useCurrencyType = (id?: string) => {
  return useQuery({
    queryKey: currencyTypeQueryKeys.detail(id || ""),
    queryFn: () => currencyTypeService.getCurrencyType(id!),
    enabled: !!id,
  });
};

export const useCreateCurrencyType = () => {
  return useMutation({
    mutationFn: (currencyType: CurrencyTypeCreate) =>
      currencyTypeService.createCurrencyType(currencyType),
    onSuccess: () => {
      toast.success("Currency type created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create currency type"),
  });
};

export const useUpdateCurrencyType = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CurrencyTypeUpdate }) =>
      currencyTypeService.updateCurrencyType(id, data),
    onSuccess: () => {
      toast.success("Currency type updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update currency type"),
  });
};

export const useDeleteCurrencyType = () => {
  return useMutation({
    mutationFn: (id: string) => currencyTypeService.deleteCurrencyType(id),
    onSuccess: () => {
      toast.success("Currency type deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete currency type");
    },
  });
};

export const useActiveCurrencyTypes = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: search
      ? [...currencyTypeQueryKeys.all, "active", search]
      : [...currencyTypeQueryKeys.all, "active"],
    queryFn: () => currencyTypeService.getActiveCurrencyTypes(search),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled,
  });
};

export const useExportCurrencyTypes = () => {
  return useMutation({
    mutationFn: (params: CurrencyTypeExportParams) =>
      currencyTypeService.exportCurrencyTypes(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `currency_types_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Currency types exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export currency types");
    },
  });
};
