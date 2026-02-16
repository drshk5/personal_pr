import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  TaxCategoryCreate,
  TaxCategoryExportParams,
  TaxCategoryFilterParams,
  TaxCategoryUpdate,
} from "@/types/central/tax-category";
import { taxCategoryService } from "@/services/central/tax-category.service";

export const taxCategoryQueryKeys = createQueryKeys("taxCategories");

export const useTaxCategories = (params?: TaxCategoryFilterParams) => {
  return useQuery({
    queryKey: taxCategoryQueryKeys.list(params || {}),
    queryFn: () => taxCategoryService.getTaxCategories(params),
  });
};

export const useTaxCategory = (id?: string) => {
  return useQuery({
    queryKey: taxCategoryQueryKeys.detail(id || ""),
    queryFn: () => taxCategoryService.getTaxCategory(id!),
    enabled: !!id,
  });
};

export const useCreateTaxCategory = () => {
  return useMutation({
    mutationFn: (taxCategory: TaxCategoryCreate) =>
      taxCategoryService.createTaxCategory(taxCategory),
    onSuccess: async () => {
      toast.success("Tax category created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create tax category"),
  });
};

export const useUpdateTaxCategory = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaxCategoryUpdate }) =>
      taxCategoryService.updateTaxCategory(id, data),
    onSuccess: async () => {
      toast.success("Tax category updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update tax category"),
  });
};

export const useDeleteTaxCategory = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      taxCategoryService.deleteTaxCategory(id),
    onSuccess: async () => {
      toast.success("Tax category deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete tax category"),
  });
};

export const useActiveTaxCategories = (
  strTaxTypeGUID: string,
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...taxCategoryQueryKeys.all, "active", strTaxTypeGUID, search],
    queryFn: () =>
      taxCategoryService.getActiveTaxCategories(strTaxTypeGUID, search),
    enabled: !!strTaxTypeGUID && enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useExportTaxCategories = () => {
  return useMutation({
    mutationFn: (params: TaxCategoryExportParams) =>
      taxCategoryService.exportTaxCategories(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `tax_categories_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Tax categories exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export tax categories"),
  });
};
