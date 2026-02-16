import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  Board,
  BoardCreate,
  BoardParams,
  BoardUpdate,
  ActiveBoardParams,
  BoardPagedParams,
  BoardPagedResponse,
  BoardSectionsWithTasksParams,
  BoardWithSectionsAndTasksResponse,
} from "@/types/task/board";
import { boardService } from "@/services/task/board.service";

export const boardQueryKeys = createQueryKeys("boards");

export const useBoards = (
  params?: BoardParams,
  options?: Omit<UseQueryOptions<Board[]>, "queryKey" | "queryFn">
) => {
  return useQuery<Board[]>({
    queryKey: boardQueryKeys.list(params || {}),
    queryFn: async () => {
      const response = await boardService.getBoards(params);
      return response || [];
    },
    ...options,
  });
};

export const useBoardsPaged = (
  params?: BoardPagedParams,
  options?: Omit<UseQueryOptions<BoardPagedResponse>, "queryKey" | "queryFn">
) => {
  return useQuery<BoardPagedResponse>({
    queryKey: [...boardQueryKeys.all, "paged", params || {}],
    queryFn: () => boardService.getBoardsPaged(params),
    ...options,
  });
};

export const useActiveBoards = (
  params?: ActiveBoardParams,
  options?: Omit<UseQueryOptions<Board[]>, "queryKey" | "queryFn">
) => {
  return useQuery<Board[]>({
    queryKey: [...boardQueryKeys.list(params || {}), "active"],
    queryFn: async () => {
      const response = await boardService.getActiveBoards(params);
      return response || [];
    },
    staleTime: 24 * 60 * 60 * 1000,
    ...options,
  });
};

export const useBoard = (id?: string) => {
  return useQuery({
    queryKey: boardQueryKeys.detail(id || ""),
    queryFn: async () => {
      return await boardService.getBoard(id!);
    },
    enabled: !!id,
  });
};

export const useBoardWithSectionsAndTasks = (
  boardGuid?: string,
  params?: BoardSectionsWithTasksParams,
  options?: Omit<
    UseQueryOptions<BoardWithSectionsAndTasksResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<BoardWithSectionsAndTasksResponse>({
    queryKey: [
      ...boardQueryKeys.all,
      "sections-with-tasks",
      boardGuid,
      params || {},
    ],
    queryFn: () =>
      boardService.getBoardWithSectionsAndTasks(boardGuid!, params),
    enabled: !!boardGuid,
    ...options,
  });
};

export const useCreateBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (board: BoardCreate) => boardService.createBoard(board),
    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: boardQueryKeys.lists(),
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: [...boardQueryKeys.lists(), "active"],
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: boardQueryKeys.details(),
        exact: false,
      });
      toast.success("Project created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create project"),
  });
};

export const useUpdateBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BoardUpdate }) =>
      boardService.updateBoard(id, data),
    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: boardQueryKeys.lists(),
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: [...boardQueryKeys.lists(), "active"],
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: boardQueryKeys.details(),
        exact: false,
      });
      toast.success("Project updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update project"),
  });
};

export const useDeleteBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => boardService.deleteBoard(id),
    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: boardQueryKeys.lists(),
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: [...boardQueryKeys.lists(), "active"],
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: boardQueryKeys.details(),
        exact: false,
      });
      toast.success("Project deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete project"),
  });
};
