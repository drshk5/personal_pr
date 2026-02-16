import { useMutation, useQuery } from "@tanstack/react-query";
import { picklistTypeService } from "@/services/central/picklist-type.service";
import type {
  PicklistTypeCreate,
  PicklistTypeExportParams,
  PicklistTypeUpdate,
} from "@/types/central/picklist-type";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import type { BaseListParams } from "@/types";

export const picklistTypeQueryKeys = createQueryKeys("picklistTypes");

export const activePicklistTypesKey = "picklistTypes";

export const usePicklistTypes = (params?: BaseListParams) => {
  return useQuery({
    queryKey: picklistTypeQueryKeys.list(params || {}),
    queryFn: () => picklistTypeService.getPicklistTypes(params),
  });
};

export const usePicklistType = (id?: string) => {
  return useQuery({
    queryKey: picklistTypeQueryKeys.detail(id || ""),
    queryFn: () => picklistTypeService.getPicklistType(id!),
    enabled: !!id,
  });
};

export const useCreatePicklistType = () => {
  return useMutation({
    mutationFn: (picklistType: PicklistTypeCreate) =>
      picklistTypeService.createPicklistType(picklistType),
    onSuccess: () => {
      toast.success("Picklist type created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create picklist type");
    },
  });
};

export const useUpdatePicklistType = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PicklistTypeUpdate }) =>
      picklistTypeService.updatePicklistType(id, data),
    onSuccess: () => {
      toast.success("Picklist type updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update picklist type");
    },
  });
};

export const useDeletePicklistType = () => {
  return useMutation({
    mutationFn: (id: string) => picklistTypeService.deletePicklistType(id),
    onSuccess: () => {
      toast.success("Picklist type deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete picklist type");
    },
  });
};

export const useActivePicklistTypes = (search?: string) => {
  return useQuery({
    queryKey: [...picklistTypeQueryKeys.all, "active", search],
    queryFn: () => picklistTypeService.getActivePicklistTypes(search),
  });
};

export const useExportPicklistTypes = () => {
  return useMutation({
    mutationFn: (params: PicklistTypeExportParams) =>
      picklistTypeService.exportPicklistTypes(params),
    onSuccess: (blob, variables) => {
      try {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const extension = variables.format === "excel" ? "xlsx" : "csv";
        link.download = `picklist-types-${timestamp}.${extension}`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(
          `Picklist types exported successfully as ${variables.format.toUpperCase()}`
        );
      } catch {
        toast.error("Failed to download the exported file");
      }
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export picklist types");
    },
  });
};
