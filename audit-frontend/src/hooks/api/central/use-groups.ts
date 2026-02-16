import { useMutation, useQuery } from "@tanstack/react-query";
import { groupService } from "@/services/central/group.service";
import type { BaseListParams } from "@/types";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

const groupQueryKeys = createQueryKeys("groups");

export const useGroups = (params?: BaseListParams) => {
  return useQuery({
    queryKey: groupQueryKeys.list(params || {}),
    queryFn: () => groupService.getGroups(params),
  });
};

export const useGroup = (id?: string) => {
  return useQuery({
    queryKey: groupQueryKeys.detail(id || ""),
    queryFn: () => groupService.getGroup(id!),
    enabled: !!id,
  });
};

export const useCreateGroup = () => {
  return useMutation({
    mutationFn: (formData: FormData) => groupService.createGroup(formData),
    onSuccess: async () => {
      toast.success("Group created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create group"),
  });
};

export const useUpdateGroup = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      groupService.updateGroup(id, data),
    onSuccess: async () => {
      toast.success("Group updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update group"),
  });
};

export const useDeleteGroup = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) => groupService.deleteGroup(id),
    onSuccess: async () => {
      toast.success("Group deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete group"),
  });
};

export const useExportGroups = () => {
  return useMutation({
    mutationFn: async (params: { format: "excel" | "csv" }) => {
      const blob = await groupService.exportGroups(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const extension = params.format === "excel" ? "xlsx" : "csv";
      link.download = `groups-${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Groups exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error) => handleMutationError(error, "Failed to export groups"),
  });
};
