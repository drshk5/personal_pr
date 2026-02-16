import { useMutation, useQuery } from "@tanstack/react-query";
import { documentModuleService } from "@/services/central/document-module.service";
import type {
  DocumentModuleCreate,
  DocumentModuleUpdate,
  DocumentModuleParams,
  ActiveDocumentModulesParams,
} from "@/types/central/document-module";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";

export const documentModuleQueryKeys = createQueryKeys("document-modules");

export const useDocumentModules = (params?: DocumentModuleParams) => {
  return useQuery({
    queryKey: documentModuleQueryKeys.list(params || {}),
    queryFn: () => documentModuleService.getDocumentModules(params),
  });
};

export const useDocumentModule = (id?: string) => {
  return useQuery({
    queryKey: documentModuleQueryKeys.detail(id || ""),
    queryFn: () => documentModuleService.getDocumentModule(id!),
    enabled: !!id,
  });
};

export const useActiveDocumentModules = (
  params?: ActiveDocumentModulesParams,
  enabled: boolean = true
) => {
  const filteredParams =
    params && Object.keys(params).length ? params : undefined;
  return useQuery({
    queryKey: ["active-document-modules", filteredParams],
    queryFn: () => documentModuleService.getActiveDocumentModules(params),
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useCreateDocumentModule = () => {
  return useMutation({
    mutationFn: (documentModule: DocumentModuleCreate) =>
      documentModuleService.createDocumentModule(documentModule),
    onSuccess: () => {
      toast.success("Document module created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create document module");
    },
  });
};

export const useUpdateDocumentModule = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentModuleUpdate }) =>
      documentModuleService.updateDocumentModule(id, data),
    onSuccess: () => {
      toast.success("Document module updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update document module");
    },
  });
};

export const useDeleteDocumentModule = () => {
  return useMutation({
    mutationFn: (id: string) => documentModuleService.deleteDocumentModule(id),
    onSuccess: () => {
      toast.success("Document module deleted successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete document module");
    },
  });
};
