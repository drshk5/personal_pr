import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { designationService } from "@/services/central/designation.service";
import type {
  DesignationCreate,
  DesignationExportParams,
  DesignationFilterParams,
  DesignationUpdate,
} from "@/types/central/designation";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const designationQueryKeys = createQueryKeys("designations");

export const activeDesignationsKey = "designations";

export const useDesignations = (
  params?: DesignationFilterParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: designationQueryKeys.list(params || {}),
    queryFn: () => designationService.getDesignations(params),
    enabled,
  });
};

export const useDesignation = (guid?: string) => {
  return useQuery({
    queryKey: designationQueryKeys.detail(guid || ""),
    queryFn: () => designationService.getDesignation(guid!),
    enabled: !!guid,
  });
};

export const useCreateDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (designation: DesignationCreate) =>
      designationService.createDesignation(designation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...designationQueryKeys.all, "active"],
      });
      toast.success("Designation created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create designation"),
  });
};

export const useUpdateDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guid, data }: { guid: string; data: DesignationUpdate }) =>
      designationService.updateDesignation(guid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...designationQueryKeys.all, "active"],
      });
      toast.success("Designation updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update designation"),
  });
};

export const useDeleteDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guid: string) => designationService.deleteDesignation(guid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...designationQueryKeys.all, "active"],
      });
      toast.success("Designation deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete designation"),
  });
};

export const useActiveDesignations = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: search
      ? [...designationQueryKeys.all, "active", search]
      : [...designationQueryKeys.all, "active"],
    queryFn: () => designationService.getActiveDesignations(search),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled,
  });
};

export const useExportDesignations = () => {
  return useMutation({
    mutationFn: (params: DesignationExportParams) =>
      designationService.exportDesignations(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `designations-${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Designations exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to export designations");
    },
  });
};
