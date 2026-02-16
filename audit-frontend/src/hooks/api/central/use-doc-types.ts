import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  DocTypeCreate,
  DocTypeParams,
  DocTypeUpdate,
} from "@/types/central/doc-type";
import { docTypeService } from "@/services/central/doc-type.service";

export const docTypeQueryKeys = createQueryKeys("doc-types");

export const useDocTypes = (params?: DocTypeParams) => {
  return useQuery({
    queryKey: docTypeQueryKeys.list(params || {}),
    queryFn: () => docTypeService.getDocTypes(params),
  });
};

export const useDocType = (id?: string) => {
  return useQuery({
    queryKey: docTypeQueryKeys.detail(id || ""),
    queryFn: () => docTypeService.getDocType(id!),
    enabled: !!id,
  });
};

export const useCreateDocType = () => {
  return useMutation({
    mutationFn: (docType: DocTypeCreate) =>
      docTypeService.createDocType(docType),
    onSuccess: async () => {
      toast.success("Document type created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create document type"),
  });
};

export const useUpdateDocType = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocTypeUpdate }) =>
      docTypeService.updateDocType(id, data),
    onSuccess: async () => {
      toast.success("Document type updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update document type"),
  });
};

export const useDeleteDocType = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) => docTypeService.deleteDocType(id),
    onSuccess: async () => {
      toast.success("Document type deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete document type"),
  });
};
