import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import { pageTemplateService } from "@/services/central/page-template.service";
import type {
  PageTemplateCreate,
  PageTemplateParams,
  PageTemplateUpdate,
} from "@/types/central/page-template";

export const pageTemplateQueryKeys = createQueryKeys("pageTemplates");

export const usePageTemplates = (params?: PageTemplateParams) => {
  return useQuery({
    queryKey: pageTemplateQueryKeys.list(params || {}),
    queryFn: () => pageTemplateService.getPageTemplates(params),
  });
};

export const usePageTemplate = (id?: string) => {
  return useQuery({
    queryKey: pageTemplateQueryKeys.detail(id || ""),
    queryFn: () => pageTemplateService.getPageTemplate(id!),
    enabled: !!id,
  });
};

export const useCreatePageTemplate = () => {
  return useMutation({
    mutationFn: (pageTemplate: PageTemplateCreate) =>
      pageTemplateService.createPageTemplate(pageTemplate),
    onSuccess: async () => {
      toast.success("Page template created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create page template"),
  });
};

export const useUpdatePageTemplate = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PageTemplateUpdate }) =>
      pageTemplateService.updatePageTemplate(id, data),
    onSuccess: async () => {
      toast.success("Page template updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update page template"),
  });
};

export const useDeletePageTemplate = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      pageTemplateService.deletePageTemplate(id),
    onSuccess: async () => {
      toast.success("Page template deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete page template"),
  });
};

export const useActivePageTemplates = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...pageTemplateQueryKeys.all, "active", search],
    queryFn: () => pageTemplateService.getActivePageTemplates(search),
    enabled,
  });
};

export const useExportPageTemplates = () => {
  return useMutation({
    mutationFn: (format: "excel" | "csv") =>
      pageTemplateService.exportPageTemplates(format),
    onSuccess: async (blob, format) => {
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const extension = format === "excel" ? "xlsx" : "csv";
      link.download = `page-templates-${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Page templates exported successfully as ${format.toUpperCase()}`
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export page templates"),
  });
};
