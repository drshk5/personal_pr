import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  BoardTeamMember,
  BoardTeamMemberParams,
  BoardTeamMemberListResponse,
  CreateBoardTeamMember,
  BulkCreateBoardTeamMember,
  BulkDeleteBoardTeamMember,
  BulkDeleteBoardTeamMemberResult,
  UpdateBoardTeamMember,
} from "@/types/task/board-team-member";
import { boardTeamMemberService } from "@/services/task/board-team-member.service";

export const boardTeamMemberQueryKeys = createQueryKeys("boardTeamMember");

export const useBoardTeamMembers = (
  strBoardGUID?: string,
  params?: BoardTeamMemberParams,
  options?: Omit<
    UseQueryOptions<BoardTeamMemberListResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<BoardTeamMemberListResponse>({
    queryKey: boardTeamMemberQueryKeys.list({ strBoardGUID, ...params }),
    queryFn: () => boardTeamMemberService.getAll(strBoardGUID!, params),
    enabled: !!strBoardGUID,
    ...options,
  });
};

export const useBoardTeamMember = (
  id?: string,
  options?: Omit<UseQueryOptions<BoardTeamMember>, "queryKey" | "queryFn">
) => {
  return useQuery<BoardTeamMember>({
    queryKey: boardTeamMemberQueryKeys.detail(id!),
    queryFn: () => boardTeamMemberService.getById(id!),
    enabled: !!id,
    ...options,
  });
};

export const useCreateBoardTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation<BoardTeamMember, Error, CreateBoardTeamMember>({
    mutationFn: (data: CreateBoardTeamMember) =>
      boardTeamMemberService.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: boardTeamMemberQueryKeys.list({}),
      });
      toast.success("Team member added successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to add team member"),
  });
};

export const useBulkCreateBoardTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation<BoardTeamMember[], Error, BulkCreateBoardTeamMember>({
    mutationFn: (data: BulkCreateBoardTeamMember) =>
      boardTeamMemberService.bulkCreate(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: boardTeamMemberQueryKeys.list({}),
      });
      toast.success("Team members added successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to add team members"),
  });
};

export const useBulkDeleteBoardTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BulkDeleteBoardTeamMemberResult,
    Error,
    BulkDeleteBoardTeamMember
  >({
    mutationFn: (data: BulkDeleteBoardTeamMember) =>
      boardTeamMemberService.bulkDelete(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: boardTeamMemberQueryKeys.list({}),
      });
      toast.success("Selected team members removed successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to remove team members"),
  });
};

export const useUpdateBoardTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BoardTeamMember,
    Error,
    { id: string; data: UpdateBoardTeamMember }
  >({
    mutationFn: ({ id, data }: { id: string; data: UpdateBoardTeamMember }) =>
      boardTeamMemberService.update(id, data),
    onSuccess: async (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: boardTeamMemberQueryKeys.list({}),
      });
      queryClient.invalidateQueries({
        queryKey: boardTeamMemberQueryKeys.detail(id),
      });
      toast.success("Team member updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update team member"),
  });
};

export const useDeleteBoardTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: (id: string) => boardTeamMemberService.delete(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: boardTeamMemberQueryKeys.list({}),
      });
      toast.success("Team member removed successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to remove team member"),
  });
};
