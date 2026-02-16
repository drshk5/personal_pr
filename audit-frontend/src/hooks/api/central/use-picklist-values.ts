import { useMutation, useQuery } from "@tanstack/react-query";
import { picklistValueService } from "@/services/central/picklist-value.service";
import type {
  PicklistValueCreate,
  PicklistValueParams,
  PicklistValueUpdate,
} from "@/types/central/picklist-value";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

const picklistValueQueryKeys = createQueryKeys("picklistValues");
const activePicklistValueQueryKeys = picklistValueQueryKeys;

export const usePicklistValues = (params?: PicklistValueParams) => {
  return useQuery({
    queryKey: picklistValueQueryKeys.list(params || {}),
    queryFn: () => picklistValueService.getPicklistValues(params),
  });
};

export const usePicklistValue = (id?: string) => {
  return useQuery({
    queryKey: picklistValueQueryKeys.detail(id || ""),
    queryFn: () => picklistValueService.getPicklistValue(id!),
    enabled: !!id,
  });
};

export const useActivePicklistValuesByType = (
  strType: string,
  search?: string
) => {
  return useQuery({
    queryKey: [...activePicklistValueQueryKeys.all, "byType", strType, search],
    queryFn: () =>
      picklistValueService.getActivePicklistValuesByType(strType, search),
    enabled: !!strType,
  });
};

export const useCreatePicklistValue = () => {
  return useMutation({
    mutationFn: (picklistValue: PicklistValueCreate) =>
      picklistValueService.createPicklistValue(picklistValue),
    onSuccess: async () => {
      toast.success("Picklist value created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create picklist value");
    },
  });
};

export const useUpdatePicklistValue = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PicklistValueUpdate;
      picklistTypeGUID?: string;
    }) => picklistValueService.updatePicklistValue(id, data),
    onSuccess: async (_, variables) => {
      if (variables.picklistTypeGUID)

      toast.success("Picklist value updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update picklist value");
    },
  });
};

export const useDeletePicklistValue = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string; picklistTypeGUID?: string }) =>
      picklistValueService.deletePicklistValue(id),
    onSuccess: async (_, variables) => {
      if (variables.picklistTypeGUID)
      toast.success("Picklist value deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete picklist value");
    },
  });
};

export const useExportPicklistValues = () => {
  return useMutation({
    mutationFn: async ({ format }: { format: "excel" | "csv" }) => {
      const blob = await picklistValueService.exportPicklistValues({ format });

      if (!blob || blob.size === 0) {
        throw new Error("Received empty file from server");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const fileExtension = format === "excel" ? "xlsx" : format;
      a.download = `PicklistValues_Export_${
        new Date().toISOString().split("T")[0]
      }.${fileExtension}`;

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      return { success: true, format };
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Picklist values exported as ${variables.format.toUpperCase()} successfully`
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export picklist values");
    },
  });
};
