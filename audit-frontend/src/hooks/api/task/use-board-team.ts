import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  BoardTeamParams,
  CreateBoardTeam,
  BoardTeamListResponse,
  BulkDeleteBoardTeamResult,
  AvailableUsersListResponse,
  UserBoards,
  UserHierarchy,
  BoardUsersResponse,
} from "@/types/task/board-team";
import type { BaseListParams } from "@/types";
import { boardTeamService } from "@/services/task/board-team.service";

export const boardTeamQueryKeys = createQueryKeys("boardTeam");

export const useBoardTeamMembers = (
  boardGuid?: string,
  params?: BoardTeamParams,
  options?: Omit<UseQueryOptions<BoardTeamListResponse>, "queryKey" | "queryFn">
) => {
  return useQuery<BoardTeamListResponse>({
    queryKey: boardTeamQueryKeys.list({ boardGuid, ...params }),
    queryFn: () => boardTeamService.getBoardTeamMembers(boardGuid!, params),
    enabled: !!boardGuid,
    ...options,
  });
};

export const useAvailableUsersForBoard = (
  boardGuid?: string,
  params?: BaseListParams,
  options?: Omit<
    UseQueryOptions<AvailableUsersListResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AvailableUsersListResponse>({
    queryKey: [
      ...boardTeamQueryKeys.list({ boardGuid }),
      "available-users",
      params,
    ],
    queryFn: () =>
      boardTeamService.getAvailableUsersForBoard(boardGuid!, params),
    enabled: !!boardGuid,
    ...options,
  });
};

export const useAddUsersToBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardGuid,
      data,
    }: {
      boardGuid: string;
      data: CreateBoardTeam;
    }) => boardTeamService.addUsersToBoard(boardGuid, data),
    onSuccess: async (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        queryClient.removeQueries({
          queryKey: [...boardTeamQueryKeys.list({}), "user"],
          exact: false,
        });
        toast.success(
          response.message || "Users added to project successfully"
        );
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to add users to project"),
  });
};

export const useRemoveUserFromBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardGuid,
      userGuid,
    }: {
      boardGuid: string;
      userGuid: string;
    }) => boardTeamService.removeUserFromBoard(boardGuid, userGuid),
    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: [...boardTeamQueryKeys.list({}), "user"],
        exact: false,
      });
      toast.success("User removed from project successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to remove user from project"),
  });
};

export const useBulkRemoveUsersFromBoard = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BulkDeleteBoardTeamResult,
    Error,
    { boardGuid: string; userGuids: string[] }
  >({
    mutationFn: ({
      boardGuid,
      userGuids,
    }: {
      boardGuid: string;
      userGuids: string[];
    }) => boardTeamService.bulkRemoveUsersFromBoard(boardGuid, userGuids),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: boardTeamQueryKeys.list({}),
      });
      queryClient.invalidateQueries({
        queryKey: [...boardTeamQueryKeys.list({}), "board"],
      });
      toast.success("Users removed from project successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to remove users from project"),
  });
};

export const useBoardsByUser = (userGuid?: string, enabled: boolean = true) => {
  return useQuery<UserBoards>({
    queryKey: [...boardTeamQueryKeys.list({}), "user", userGuid, "boards"],
    queryFn: () => boardTeamService.getBoardsByUser(userGuid!),
    enabled: !!userGuid && enabled,
    staleTime: 60 * 60 * 1000,
  });
};

export const useUserHierarchy = (
  userGuid?: string,
  strBoardGUID?: string,
  enabled: boolean = true
) => {
  return useQuery<UserHierarchy>({
    queryKey: [
      ...boardTeamQueryKeys.list({}),
      "user",
      userGuid,
      "hierarchy",
      strBoardGUID,
    ],
    queryFn: () => boardTeamService.getUserHierarchy(userGuid!, strBoardGUID!),
    enabled: !!userGuid && !!strBoardGUID && enabled,
    staleTime: 60 * 60 * 1000,
  });
};

export const useBoardUsers = (
  strBoardGUID?: string,
  enabled: boolean = true,
  options?: Omit<UseQueryOptions<BoardUsersResponse>, "queryKey" | "queryFn">
) => {
  return useQuery<BoardUsersResponse>({
    queryKey: [...boardTeamQueryKeys.list({}), "board", strBoardGUID, "users"],
    queryFn: () => boardTeamService.getBoardUsers(strBoardGUID!),
    enabled: !!strBoardGUID && enabled,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};
