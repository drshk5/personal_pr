import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  BoardSubModuleActive,
  BoardSubModuleCreate,
  BulkCreateBoardSubModule,
  BulkCreateBoardSubModuleResponse,
  BoardSubModuleParams,
  BoardSubModuleUpdate,
} from "@/types/task/board-sub-module";
import { boardSubModuleService } from "@/services/task/board-sub-module.service";

export const boardSubModuleQueryKeys = createQueryKeys("boardSubModules");

export const useBoardSubModules = (params: BoardSubModuleParams = {}) => {
  return useQuery({
    queryKey: boardSubModuleQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await boardSubModuleService.getBoardSubModules(params);
      return response;
    },
    enabled: true,
  });
};

export const useBoardSubModule = (id?: string) => {
  return useQuery({
    queryKey: boardSubModuleQueryKeys.detail(id || ""),
    queryFn: async () => {
      const response = await boardSubModuleService.getBoardSubModule(id!);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useActiveBoardSubModules = (
  sectionGuid?: string,
  options?: Omit<
    UseQueryOptions<BoardSubModuleActive[]>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<BoardSubModuleActive[]>({
    queryKey: [...boardSubModuleQueryKeys.all, "active", sectionGuid],
    queryFn: () => boardSubModuleService.getActiveBoardSubModules(sectionGuid!),
    enabled: !!sectionGuid,
    ...options,
  });
};

export const useBoardSubModulesBySection = (
  sectionGuid?: string,
  params?: BoardSubModuleParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...boardSubModuleQueryKeys.all, "bySection", sectionGuid, params],
    queryFn: async () => {
      const response = await boardSubModuleService.getBoardSubModulesBySection(
        sectionGuid!,
        params
      );
      return response;
    },
    enabled: !!sectionGuid && enabled,
    staleTime: 60 * 60 * 1000,
  });
};

export const useCreateBoardSubModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardSubModule: BoardSubModuleCreate) =>
      boardSubModuleService.createBoardSubModule(boardSubModule),
    onSuccess: async (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSubModuleQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSubModuleQueryKeys.all, "bySection"],
          exact: false,
        });
        toast.success(response.message || "Sub module created successfully");
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create sub module"),
  });
};

export const useBulkCreateBoardSubModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkCreateBoardSubModule) =>
      boardSubModuleService.bulkCreateBoardSubModules(payload),
    onSuccess: async (response: BulkCreateBoardSubModuleResponse) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSubModuleQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSubModuleQueryKeys.all, "bySection"],
          exact: false,
        });
        toast.success(response.message || "Sub modules created successfully");
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create sub modules"),
  });
};

export const useUpdateBoardSubModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BoardSubModuleUpdate }) =>
      boardSubModuleService.updateBoardSubModule(id, data),
    onSuccess: async (response, variables) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSubModuleQueryKeys.detail(variables.id),
        });
        queryClient.invalidateQueries({
          queryKey: boardSubModuleQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSubModuleQueryKeys.all, "bySection"],
          exact: false,
        });
        toast.success(response.message || "Sub module updated successfully");
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update sub module"),
  });
};

export const useDeleteBoardSubModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      boardSubModuleService.deleteBoardSubModule(id),
    onSuccess: async (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSubModuleQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSubModuleQueryKeys.all, "bySection"],
          exact: false,
        });
        toast.success(response.message || "Sub module deleted successfully");
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete sub module"),
  });
};

export const useCopyFromBoardSubModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetBoardSectionGuid,
      request,
    }: {
      targetBoardSectionGuid: string;
      request: { strSourceBoardSectionGUID: string; strSubModuleGUIDs?: string[] };
    }) =>
      boardSubModuleService.copyFromBoardSubModules(
        targetBoardSectionGuid,
        request
      ),
    onSuccess: async (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.invalidateQueries({
          queryKey: boardSubModuleQueryKeys.list({}),
        });
        queryClient.removeQueries({
          queryKey: [...boardSubModuleQueryKeys.all, "bySection"],
          exact: false,
        });
        toast.success(
          response.message || "Sub modules copied successfully"
        );
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to copy sub modules"),
  });
};
