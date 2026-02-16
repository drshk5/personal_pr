import { useMutation, useQuery } from "@tanstack/react-query";
import { legalStatusTypeService } from "@/services/central/legal-status-type.service";
import type {
  LegalStatusTypeCreate,
  LegalStatusTypeExportParams,
  LegalStatusTypeUpdate,
} from "@/types/central/legal-status-type";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import type { BaseListParams } from "@/types";

export const legalStatusTypeQueryKeys = createQueryKeys("legalStatusTypes");

export const useLegalStatusTypes = (params?: BaseListParams) => {
  return useQuery({
    queryKey: legalStatusTypeQueryKeys.list(params || {}),
    queryFn: () => legalStatusTypeService.getLegalStatusTypes(params),
  });
};

export const useLegalStatusType = (id?: string) => {
  return useQuery({
    queryKey: legalStatusTypeQueryKeys.detail(id || ""),
    queryFn: () => legalStatusTypeService.getLegalStatusType(id!),
    enabled: !!id,
  });
};

export const useCreateLegalStatusType = () => {
  return useMutation({
    mutationFn: (legalStatusType: LegalStatusTypeCreate) =>
      legalStatusTypeService.createLegalStatusType(legalStatusType),
    onSuccess: () => {
      toast.success("Legal status type created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create legal status type"),
  });
};

export const useUpdateLegalStatusType = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LegalStatusTypeUpdate }) =>
      legalStatusTypeService.updateLegalStatusType(id, data),
    onSuccess: () => {
      toast.success("Legal status type updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update legal status type"),
  });
};

export const useDeleteLegalStatusType = () => {
  return useMutation({
    mutationFn: (id: string) =>
      legalStatusTypeService.deleteLegalStatusType(id),
    onSuccess: () => {
      toast.success("Legal status type deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete legal status type"),
  });
};

export const useActiveLegalStatusTypes = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: search
      ? [...legalStatusTypeQueryKeys.all, "active", search]
      : [...legalStatusTypeQueryKeys.all, "active"],
    queryFn: () => legalStatusTypeService.getActiveLegalStatusTypes(search),
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useExportLegalStatusTypes = () => {
  return useMutation({
    mutationFn: (params: LegalStatusTypeExportParams) =>
      legalStatusTypeService.exportLegalStatusTypes(params),
    onSuccess: (blob, variables) => {
      try {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const extension = variables.format === "excel" ? "xlsx" : "csv";
        link.download = `legal-status-types-${timestamp}.${extension}`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(
          `Legal status types exported successfully as ${variables.format.toUpperCase()}`
        );
      } catch {
        toast.error("Failed to download the exported file");
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export legal status types"),
  });
};
