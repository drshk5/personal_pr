import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  TaxRateCreate,
  TaxRateExportParams,
  TaxRateFilterParams,
  TaxRateUpdate,
} from "@/types/central/tax-rate";
import { taxRateService } from "@/services/central/tax-rate.service";

export const taxRateQueryKeys = createQueryKeys("taxRates");

export const useTaxRates = (params?: TaxRateFilterParams) => {
  return useQuery({
    queryKey: taxRateQueryKeys.list(params || {}),
    queryFn: () => taxRateService.getTaxRates(params),
    enabled: !!params?.strTaxCategoryGUID,
  });
};

export const useTaxRate = (id?: string) => {
  return useQuery({
    queryKey: taxRateQueryKeys.detail(id || ""),
    queryFn: () => taxRateService.getTaxRate(id!),
    enabled: !!id,
  });
};

export const useCreateTaxRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taxRate: TaxRateCreate) =>
      taxRateService.createTaxRate(taxRate),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taxRateQueryKeys.all });
      toast.success("Tax rate created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create tax rate"),
  });
};

export const useUpdateTaxRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaxRateUpdate }) =>
      taxRateService.updateTaxRate(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taxRateQueryKeys.all });
      toast.success("Tax rate updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update tax rate"),
  });
};

export const useDeleteTaxRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id }: { id: string }) => taxRateService.deleteTaxRate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taxRateQueryKeys.all });
      toast.success("Tax rate deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete tax rate"),
  });
};

export const useActiveTaxRates = (strTaxTypeGUID: string, search?: string) => {
  return useQuery({
    queryKey: [...taxRateQueryKeys.all, "active", strTaxTypeGUID, search],
    queryFn: () => taxRateService.getActiveTaxRates(strTaxTypeGUID, search),
    enabled: !!strTaxTypeGUID,
  });
};

export const useExportTaxRates = () => {
  return useMutation({
    mutationFn: (params: TaxRateExportParams) =>
      taxRateService.exportTaxRates(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `tax_rates_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Tax rates exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export tax rates"),
  });
};
