import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "../common";
import { renameScheduleService } from "@/services/central/rename-schedule.service";
import type { RenameScheduleUpsert } from "@/types/central/rename-schedule";

interface RenameScheduleParams {
  search?: string;
}

export const renameScheduleQueryKeys = createQueryKeys("renameSchedules");

export const useRenameSchedules = (params?: RenameScheduleParams) => {
  return useQuery({
    queryKey: renameScheduleQueryKeys.list(params || {}),
    queryFn: () =>
      renameScheduleService.getRenameSchedules(
        params?.search ? { search: params.search } : {}
      ),
    retry: 1,
    staleTime: 300000, // Set to 5 minutes
  });
};

export const useUpsertRenameSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RenameScheduleUpsert) =>
      renameScheduleService.upsertRenameSchedule(data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: renameScheduleQueryKeys.all,
      });

      const action = variables.strRenameScheduleGUID ? "updated" : "created";
      toast.success(`Chart of account ${action} successfully`);
    },
    onError: (error) =>
      handleMutationError(error, "Failed to save chart of account"),
  });
};

export const useDeleteRenameSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => renameScheduleService.deleteRenameSchedule(id),
    onSuccess: async () => {
      // Invalidate queries and wait for refetch to complete
      await queryClient.invalidateQueries({
        queryKey: renameScheduleQueryKeys.all,
      });

      toast.success("Chart of account deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete chart of account"),
  });
};
