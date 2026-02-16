import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { taskImportService } from "@/services/task/task-import.service";
import type {
  TaskColumnMapping,
  ImportProgress,
  ImportError,
  TaskImportStatistics,
  ImportStatusDto,
} from "@/types/task/task-import";
import { handleMutationError } from "@/hooks/api/common";

export const usePreviewExcel = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const response = await taskImportService.previewExcel(file);
      return response.data;
    },
    onError: (error) => {
      handleMutationError(error, "Failed to preview Excel file");
    },
  });
};

export const useImportTasks = () => {
  return useMutation({
    mutationFn: async ({
      file,
      columnMapping,
    }: {
      file: File;
      columnMapping?: TaskColumnMapping;
    }) => {
      const response = await taskImportService.importTasks(file, columnMapping);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Import started successfully. Import ID: ${data.importId}`);
    },
    onError: (error) => {
      handleMutationError(error, "Failed to start import");
    },
  });
};

/**
 * Get import status from hub-backend (persisted across sessions)
 * Use this to check status anytime, even after user logout
 */
export const useImportStatus = (importId?: string, enabled = true) => {
  return useQuery<ImportStatusDto>({
    queryKey: ["taskImport", "status", importId],
    queryFn: async () => {
      const response = await taskImportService.getImportStatus(importId!);
      return response.data;
    },
    enabled: enabled && !!importId,
    // Only refetch if still processing
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || !data.isBackgroundProcessing) {
        return false;
      }
      return 5000;
    },
  });
};

/**
 * @deprecated This hook is deprecated. Use useImportSignalRProgress from hooks instead
 * for real-time updates via WebSocket.
 */
export const useImportProgress = (importId?: string, enabled = true) => {
  return useQuery<ImportProgress>({
    queryKey: ["taskImport", "progress", importId],
    queryFn: async () => {
      const response = await taskImportService.getImportProgress(importId!);
      return response.data;
    },
    enabled: enabled && !!importId,
    refetchInterval: false, // Disabled - use SignalR instead
  });
};

export const useImportErrors = (importId?: string, enabled = true) => {
  return useQuery<ImportError[]>({
    queryKey: ["taskImport", "errors", importId],
    queryFn: async () => {
      const response = await taskImportService.getImportErrors(importId!);
      return response.data;
    },
    enabled: enabled && !!importId,
  });
};

export const useFetchImportErrors = () => {
  return useMutation({
    mutationFn: async (importId: string) => {
      const response = await taskImportService.getImportErrors(importId);
      return response.data;
    },
    onError: (error) => {
      handleMutationError(error, "Failed to fetch import errors");
    },
  });
};

export const useStopImport = () => {
  return useMutation({
    mutationFn: async (importId: string) => {
      const response = await taskImportService.stopImport(importId);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Import stopped successfully");
    },
    onError: (error) => {
      handleMutationError(error, "Failed to stop import");
    },
  });
};

export const useImportStatistics = (
  pageNumber = 1,
  pageSize = 20,
  search?: string,
  enabled = true
) => {
  return useQuery<TaskImportStatistics>({
    queryKey: ["taskImport", "statistics", pageNumber, pageSize, search ?? ""],
    queryFn: async () => {
      const response = await taskImportService.getImportStatistics(
        pageNumber,
        pageSize,
        search
      );

      const items = (response?.data ?? []).slice();
      items.sort(
        (a, b) =>
          new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
      );

      const totalRecords = response?.totalRecords ?? items.length;

      const computedTotalPages =
        pageSize > 0 ? Math.max(1, Math.ceil(totalRecords / pageSize)) : 1;
      const totalPages = response?.totalPages ?? computedTotalPages;

      const resolvedPageNumber = response?.pageNumber ?? pageNumber;
      const resolvedPageSize = response?.pageSize ?? pageSize;
      const hasPrevious = response?.hasPreviousPage ?? resolvedPageNumber > 1;
      const hasNext = response?.hasNextPage ?? resolvedPageNumber < totalPages;

      return {
        importList: items,
        importIds: items.map((item) => item.importId),
        importNames: items.map((item) => item.fileName),
        data: items,
        pageNumber: resolvedPageNumber,
        pageSize: resolvedPageSize,
        totalPages,
        totalRecords,
        hasPreviousPage: hasPrevious,
        hasNextPage: hasNext,
        hasPrevious,
        hasNext,
      };
    },
    enabled,
  });
};
