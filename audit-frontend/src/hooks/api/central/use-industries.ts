import { useMutation, useQuery } from "@tanstack/react-query";
import { industryService } from "@/services/central/industry.service";
import type {
  IndustryCreate,
  IndustryExportParams,
  IndustryUpdate,
} from "@/types/central/industry";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import type { BaseListParams } from "@/types";

export const industryQueryKeys = createQueryKeys("industries");

export const activeIndustriesKey = "industries";

export const useIndustries = (params?: BaseListParams) => {
  return useQuery({
    queryKey: industryQueryKeys.list(params || {}),
    queryFn: () => industryService.getIndustries(params),
  });
};

export const useIndustry = (id?: string) => {
  return useQuery({
    queryKey: industryQueryKeys.detail(id || ""),
    queryFn: () => industryService.getIndustry(id!),
    enabled: !!id,
  });
};

export const useCreateIndustry = () => {
  return useMutation({
    mutationFn: (industry: IndustryCreate) =>
      industryService.createIndustry(industry),
    onSuccess: () => {
      toast.success("Industry created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create industry"),
  });
};

export const useUpdateIndustry = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IndustryUpdate }) =>
      industryService.updateIndustry(id, data),
    onSuccess: () => {
      toast.success("Industry updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update industry"),
  });
};

export const useDeleteIndustry = () => {
  return useMutation({
    mutationFn: (id: string) => industryService.deleteIndustry(id),
    onSuccess: () => {
      toast.success("Industry deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete industry"),
  });
};

export const useActiveIndustries = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: search
      ? [...industryQueryKeys.all, "active", search]
      : [...industryQueryKeys.all, "active"],
    queryFn: () => industryService.getActiveIndustries(search),
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useExportIndustries = () => {
  return useMutation({
    mutationFn: (params: IndustryExportParams) =>
      industryService.exportIndustries(params),
    onSuccess: (blob, variables) => {
      try {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const extension = variables.format === "excel" ? "xlsx" : "csv";
        link.download = `industries-${timestamp}.${extension}`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(
          `Industries exported successfully as ${variables.format.toUpperCase()}`
        );
      } catch {
        toast.error("Failed to download the exported file");
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export industries"),
  });
};
