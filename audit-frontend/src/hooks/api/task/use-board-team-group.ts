import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  BoardTeamGroup,
  BoardTeamGroupActive,
  BoardTeamGroupSimple,
  BoardTeamGroupListResponse,
  BoardTeamGroupParams,
  CreateBoardTeamGroup,
  UpdateBoardTeamGroup,
  AvailableUsersForTeamGroupResponse,
} from "@/types/task/board-team-group";
import type { BaseListParams } from "@/types";
import { boardTeamGroupService } from "@/services/task/board-team-group.service";

export const boardTeamGroupQueryKeys = createQueryKeys("boardTeamGroup");

export const useBoardTeamGroups = (
  strBoardGUID?: string,
  params?: BoardTeamGroupParams,
  options?: Omit<
    UseQueryOptions<BoardTeamGroupListResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<BoardTeamGroupListResponse>({
    queryKey: boardTeamGroupQueryKeys.list({ strBoardGUID, ...params }),
    queryFn: () => boardTeamGroupService.getAll(strBoardGUID!, params),
    enabled: !!strBoardGUID,
    ...options,
  });
};

export const useBoardTeamGroup = (
  id?: string,
  options?: Omit<UseQueryOptions<BoardTeamGroup>, "queryKey" | "queryFn">
) => {
  return useQuery<BoardTeamGroup>({
    queryKey: boardTeamGroupQueryKeys.detail(id!),
    queryFn: () => boardTeamGroupService.getById(id!),
    enabled: !!id,
    ...options,
  });
};

export const useActiveBoardTeamGroups = (
  strBoardGUID?: string,
  options?: Omit<
    UseQueryOptions<BoardTeamGroupActive[]>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<BoardTeamGroupActive[]>({
    queryKey: [...boardTeamGroupQueryKeys.all, "active", strBoardGUID],
    queryFn: () => boardTeamGroupService.getActiveTeams(strBoardGUID!),
    enabled: !!strBoardGUID,
    ...options,
  });
};

export const useCreateBoardTeamGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<BoardTeamGroupSimple, Error, CreateBoardTeamGroup>({
    mutationFn: (data: CreateBoardTeamGroup) =>
      boardTeamGroupService.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: boardTeamGroupQueryKeys.list({}),
      });
      toast.success("Team created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create team"),
  });
};

export const useUpdateBoardTeamGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BoardTeamGroupSimple,
    Error,
    { id: string; data: UpdateBoardTeamGroup }
  >({
    mutationFn: ({ id, data }: { id: string; data: UpdateBoardTeamGroup }) =>
      boardTeamGroupService.update(id, data),
    onSuccess: async (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: boardTeamGroupQueryKeys.list({}),
      });
      queryClient.invalidateQueries({
        queryKey: boardTeamGroupQueryKeys.detail(id),
      });
      toast.success("Team updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update team"),
  });
};

export const useDeleteBoardTeamGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: (id: string) => boardTeamGroupService.delete(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: boardTeamGroupQueryKeys.list({}),
      });
      toast.success("Team deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete team"),
  });
};

export const useAvailableUsersForTeamGroup = (
  strBoardGUID?: string,
  strTeamGUID?: string,
  params?: BaseListParams,
  options?: Omit<
    UseQueryOptions<AvailableUsersForTeamGroupResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AvailableUsersForTeamGroupResponse>({
    queryKey: [
      ...boardTeamGroupQueryKeys.list({}),
      "available-users",
      strBoardGUID,
      strTeamGUID,
      params,
    ],
    queryFn: () =>
      boardTeamGroupService.getAvailableUsers(
        strBoardGUID!,
        strTeamGUID!,
        params
      ),
    enabled: !!strBoardGUID && !!strTeamGUID,
    ...options,
  });
};
