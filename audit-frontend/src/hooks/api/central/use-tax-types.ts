import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  TaxTypeCreate,
  TaxTypeExportParams,
  TaxTypeFilterParams,
  TaxTypeUpdate,
} from "@/types/central/tax-type";
import { taxTypeService } from "@/services/central/tax-type.service";

export const taxTypeQueryKeys = createQueryKeys("taxTypes");

export const useTaxTypes = (params?: TaxTypeFilterParams) => {
  return useQuery({
    queryKey: taxTypeQueryKeys.list(params || {}),
    queryFn: () => taxTypeService.getTaxTypes(params),
  });
};

export const useTaxType = (id?: string) => {
  return useQuery({
    queryKey: taxTypeQueryKeys.detail(id || ""),
    queryFn: () => taxTypeService.getTaxType(id!),
    enabled: !!id,
  });
};

export const useCreateTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taxType: TaxTypeCreate) =>
      taxTypeService.createTaxType(taxType),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: taxTypeQueryKeys.lists() });
      queryClient.removeQueries({
        queryKey: [...taxTypeQueryKeys.all, "active"],
      });
      toast.success("Tax type created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create tax type"),
  });
};

export const useUpdateTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaxTypeUpdate }) =>
      taxTypeService.updateTaxType(id, data),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: taxTypeQueryKeys.lists() });
      queryClient.removeQueries({
        queryKey: [...taxTypeQueryKeys.all, "active"],
      });
      toast.success("Tax type updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update tax type"),
  });
};

export const useDeleteTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => taxTypeService.deleteTaxType(id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: taxTypeQueryKeys.lists() });
      queryClient.removeQueries({
        queryKey: [...taxTypeQueryKeys.all, "active"],
      });
      toast.success("Tax type deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete tax type"),
  });
};

export const useActiveTaxTypes = (
  search?: string,
  strCountryGUID?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...taxTypeQueryKeys.all, "active", search, strCountryGUID],
    queryFn: () => taxTypeService.getActiveTaxTypes(search, strCountryGUID),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled,
  });
};

export const useExportTaxTypes = () => {
  return useMutation({
    mutationFn: (params: TaxTypeExportParams) =>
      taxTypeService.exportTaxTypes(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `tax_types_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Tax types exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export tax types"),
  });
};
