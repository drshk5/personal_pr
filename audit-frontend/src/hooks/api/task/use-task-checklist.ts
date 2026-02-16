import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  TaskChecklistCreate,
  TaskChecklistParams,
  TaskChecklistUpdate,
} from "@/types/task/checklist";
import { taskChecklistService } from "@/services/task/task-checklist.service";
import { taskQueryKeys } from "./use-task";

export const taskChecklistQueryKeys = createQueryKeys("taskChecklists");

export const useTaskChecklists = (params?: TaskChecklistParams) => {
  const hasTaskGuid = Boolean(params?.strTaskGUID);
  return useQuery({
    queryKey: taskChecklistQueryKeys.list(params || {}),
    queryFn: () => taskChecklistService.getTaskChecklists(params),
    enabled: hasTaskGuid,
  });
};

export const useTaskChecklist = (id?: string) => {
  return useQuery({
    queryKey: taskChecklistQueryKeys.detail(id || ""),
    queryFn: () => taskChecklistService.getTaskChecklist(id!),
    enabled: !!id,
  });
};

export const useCreateTaskChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checklist: TaskChecklistCreate) =>
      taskChecklistService.createTaskChecklist(checklist),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: taskChecklistQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      toast.success("Sub Task created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create Sub Task"),
  });
};

export const useUpdateTaskChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskChecklistUpdate }) =>
      taskChecklistService.updateTaskChecklist(id, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: taskChecklistQueryKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      toast.success("Sub Task updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update Sub Task"),
  });
};

export const useDeleteTaskChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      taskChecklistService.deleteTaskChecklist(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: taskChecklistQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      toast.success("Sub Task deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete Sub Task"),
  });
};

export const useCompleteTaskChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; taskGUID?: string }) =>
      taskChecklistService.completeTaskChecklist(id),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskChecklistQueryKeys.all });
      if (variables.taskGUID) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(variables.taskGUID) });
      }
      toast.success("Sub Task completed");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to complete Sub Task"),
  });
};

export const useUncompleteTaskChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; taskGUID?: string }) =>
      taskChecklistService.uncompleteTaskChecklist(id),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskChecklistQueryKeys.all });
      // Invalidate specific task detail to update completion counts without triggering list refetch
      if (variables.taskGUID) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(variables.taskGUID) });
      }
      toast.success("Sub Task marked as incomplete");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to mark Sub Task as incomplete"),
  });
};

export const useReorderTaskChecklists = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      checklistIds,
    }: {
      taskId: string;
      checklistIds: string[];
    }) => taskChecklistService.reorderTaskChecklists(taskId, checklistIds),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: taskChecklistQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      toast.success("Sub Tasks reordered successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to reorder Sub Tasks"),
  });
};
