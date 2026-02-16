import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentService } from "@/services/central/document.service";
import type {
  DocumentParams,
  DocumentUpdate,
  DocumentUploadRequest,
  DocumentBulkChangeDeleteStatusDto,
  DocumentBulkMoveToFolderDto,
  DocumentBulkAssignDto,
} from "@/types";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { folderQueryKeys } from "./use-folders";

export const documentQueryKeys = createQueryKeys("documents");

export const useDocuments = (
  params?: DocumentParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: documentQueryKeys.list(params || {}),
    queryFn: () => documentService.getDocuments(params),
    enabled: options?.enabled !== false,
  });
};

export const useDocument = (id?: string) => {
  return useQuery({
    queryKey: documentQueryKeys.detail(id || ""),
    queryFn: () => documentService.getDocument(id!),
    enabled: !!id,
  });
};

export const useUploadDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentUploadRequest) =>
      documentService.uploadDocuments(data),
    onSuccess: () => {
      toast.success("Documents uploaded successfully");
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to upload documents"),
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdate }) =>
      documentService.updateDocument(id, data),
    onSuccess: () => {
      toast.success("Document updated successfully");
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    },
    onError: (error) => handleMutationError(error, "Failed to update document"),
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });
    },
    onError: (error) => handleMutationError(error, "Failed to delete document"),
  });
};

export const useBulkDeleteDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => documentService.bulkDeleteDocuments(ids),
    onSuccess: () => {
      toast.success("Documents deleted successfully");
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete documents"),
  });
};

export const useBulkChangeDeleteStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentBulkChangeDeleteStatusDto) =>
      documentService.bulkChangeDeleteStatus(data),
    onSuccess: (response, variables) => {
      if (!response.details) {
        toast.success(response.message);
        queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
        queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });
        return;
      }

      const result = response.details;
      const action = variables.bolIsDeleted ? "deleted" : "restored";

      if (result.FailureCount === 0) {
        toast.success(response.message);
      } else if (result.SuccessCount === 0) {
        const errorMsg = result.Failures[0]?.ErrorMessage || "Unknown error";
        toast.error(errorMsg);
      } else {
        const uniqueErrors = [
          ...new Set(result.Failures.map((f) => f.ErrorMessage)),
        ];
        const errorMessages = uniqueErrors.join("; ");

        toast.warning(
          `${result.SuccessCount} document(s) ${action} successfully. ${result.FailureCount} failed: ${errorMessages}`
        );
      }
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            details?: {
              Failures?: Array<{ ErrorMessage: string }>;
            };
          };
        };
      };

      if (err?.response?.data?.details) {
        const details = err.response.data.details;
        const uniqueErrors = [
          ...new Set(details.Failures?.map((f) => f.ErrorMessage) || []),
        ];
        const errorMessages = uniqueErrors.join("; ");
        toast.error(
          errorMessages ||
            err.response.data.message ||
            "Failed to change document delete status"
        );
      } else {
        handleMutationError(error, "Failed to change document delete status");
      }
    },
  });
};

export const useBulkSoftDelete = () => {
  return useMutation({
    mutationFn: (ids: string[]) => documentService.bulkSoftDelete(ids),
    onSuccess: () => {
      toast.success("Documents marked as deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to mark documents as deleted"),
  });
};

export const useBulkMoveToFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentBulkMoveToFolderDto) =>
      documentService.bulkMoveToFolder(data),
    onSuccess: () => {
      toast.success("Documents moved successfully");
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });
    },
    onError: (error) => handleMutationError(error, "Failed to move documents"),
  });
};

export const useBulkAssignDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentBulkAssignDto) =>
      documentService.bulkAssign(data),
    onSuccess: (response) => {
      if (!response.details) {
        toast.success(response.message);
        queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
        return;
      }

      const result = response.details;

      if (result.FailureCount === 0) {
        toast.success(response.message);
      } else if (result.SuccessCount === 0) {
        const errorMsg = result.Failures[0]?.ErrorMessage || "Unknown error";
        toast.error(errorMsg);
      } else {
        const uniqueErrors = [
          ...new Set(result.Failures.map((f) => f.ErrorMessage)),
        ];
        const errorMessages = uniqueErrors.join("; ");

        toast.warning(
          `${result.SuccessCount} document(s) assigned successfully. ${result.FailureCount} failed: ${errorMessages}`
        );
      }
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            details?: {
              Failures?: Array<{ ErrorMessage: string }>;
            };
          };
        };
      };

      if (err?.response?.data?.details) {
        const details = err.response.data.details;
        const uniqueErrors = [
          ...new Set(details.Failures?.map((f) => f.ErrorMessage) || []),
        ];
        const errorMessages = uniqueErrors.join("; ");
        toast.error(
          errorMessages ||
            err.response.data.message ||
            "Failed to assign documents"
        );
      } else {
        handleMutationError(error, "Failed to assign documents");
      }
    },
  });
};
