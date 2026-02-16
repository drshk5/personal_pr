import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  BoardSectionCreate,
  BulkCreateBoardSection,
  BulkCreateBoardSectionResponse,
  BoardSectionParams,
  BoardSectionUpdate,
  CopyFromBoardSectionRequest,
} from "@/types/task/board-section";
import { boardSectionService } from "@/services/task/board-section.service";

export const boardSectionQueryKeys = createQueryKeys("boardSections");

export const useBoardSections = (
  params: BoardSectionParams = {},
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: boardSectionQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await boardSectionService.getBoardSections(params);
      return {
        data: response.data || [],
        totalCount: response.totalRecords || 0,
        totalPages: response.totalPages || 0,
        currentPage: response.pageNumber || 1,
        pageSize: response.pageSize || 10,
      };
    },
    enabled,
  });
};

export const useBoardSection = (id?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: boardSectionQueryKeys.detail(id || ""),
    queryFn: async () => {
      const response = await boardSectionService.getBoardSection(id!);
      return response.data;
    },
    enabled: !!id && enabled,
  });
};

export const useBoardSectionHighestTaskPosition = (
  boardGuid?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [
      ...boardSectionQueryKeys.all,
      "highest-task-position",
      boardGuid,
    ],
    queryFn: async () => {
      try {
        const response =
          await boardSectionService.getBoardSectionWithHighestTaskPosition(
            boardGuid!
          );
        return response.data;
      } catch (error) {
        const apiError = error as { response?: { status?: number } };
        if (apiError?.response?.status === 404) {
          return null;
        }

        throw error;
      }
    },
    enabled: !!boardGuid && enabled,
  });
};

export const useBoardSectionsByBoardGuid = (
  boardGuid?: string,
  params?: BoardSectionParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...boardSectionQueryKeys.all, "byBoard", boardGuid, params],
    queryFn: async () => {
      const response = await boardSectionService.getBoardSectionsByBoardGuid(
        boardGuid!,
        params
      );
      return {
        data: response.data || [],
        totalCount: response.totalRecords || 0,
        totalPages: response.totalPages || 0,
        currentPage: response.pageNumber || 1,
        pageSize: response.pageSize || 10,
      };
    },
    enabled: !!boardGuid && enabled,
  });
};

export const useCreateBoardSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardSection: BoardSectionCreate) =>
      boardSectionService.createBoardSection(boardSection),
    onSuccess: async (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSectionQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSectionQueryKeys.all, "byBoard"],
          exact: false,
        });
        toast.success(
          response.message || "Project Modules created successfully"
        );
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create project modules"),
  });
};

export const useBulkCreateBoardSections = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkCreateBoardSection) =>
      boardSectionService.bulkCreateBoardSections(payload),
    onSuccess: async (response: BulkCreateBoardSectionResponse) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSectionQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSectionQueryKeys.all, "byBoard"],
          exact: false,
        });
        toast.success(response.message || "Project Modules created successfully");
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create project modules"),
  });
};

export const useUpdateBoardSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BoardSectionUpdate }) =>
      boardSectionService.updateBoardSection(id, data),
    onSuccess: async (response, variables) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSectionQueryKeys.detail(variables.id),
        });
        queryClient.invalidateQueries({
          queryKey: boardSectionQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSectionQueryKeys.all, "byBoard"],
          exact: false,
        });
        toast.success(
          response.message || "Project Modules updated successfully"
        );
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update project modules"),
  });
};

export const useDeleteBoardSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      boardSectionService.deleteBoardSection(id),
    onSuccess: async (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSectionQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSectionQueryKeys.all, "byBoard"],
          exact: false,
        });
        toast.success(
          response.message || "Project Modules deleted successfully"
        );
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete project modules"),
  });
};

export const useReorderBoardSections = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardGuid,
      orderedSectionGUIDs,
    }: {
      boardGuid: string;
      orderedSectionGUIDs: string[];
    }) =>
      boardSectionService.reorderBoardSections(boardGuid, orderedSectionGUIDs),
    onSuccess: async (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSectionQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSectionQueryKeys.all, "byBoard"],
          exact: false,
        });
        toast.success(
          response.message || "Project Modules reordered successfully"
        );
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to reorder project modules"),
  });
};

export const useCopyFromBoardSections = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetBoardGuid,
      request,
    }: {
      targetBoardGuid: string;
      request: CopyFromBoardSectionRequest;
    }) => boardSectionService.copyFromBoardSections(targetBoardGuid, request),
    onSuccess: async (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSectionQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSectionQueryKeys.all, "byBoard"],
          exact: false,
        });
        toast.success(
          response.message || "Project Modules copied successfully"
        );
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to copy project modules"),
  });
};
