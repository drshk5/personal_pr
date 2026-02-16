import {
  useMutation,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  Task,
  TaskCreate,
  TaskUpdate,
  AssignedByMeParams,
  AssignedByMeTaskListItem,
} from "@/types/task/task";
import { assignTaskService } from "@/services/task/assign-task.service";
import type { BackendPagedResponse } from "@/types";

export const assignTaskQueryKeys = createQueryKeys("assignTasks");

export const useAssignedByMeTasks = (
  params?: AssignedByMeParams,
  options?: Omit<
    UseQueryOptions<BackendPagedResponse<AssignedByMeTaskListItem[]>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<BackendPagedResponse<AssignedByMeTaskListItem[]>>({
    queryKey: assignTaskQueryKeys.list(params || {}),
    queryFn: () => assignTaskService.getTasksAssignedByMe(params),
    ...options,
  });
};

export const useAssignedTask = (
  guid?: string,
  options?: Omit<UseQueryOptions<Task>, "queryKey" | "queryFn">
) => {
  return useQuery<Task>({
    queryKey: assignTaskQueryKeys.detail(guid || ""),
    queryFn: () => assignTaskService.getTask(guid!),
    enabled: !!guid,
    ...options,
  });
};

export const useCreateAssignedTask = () => {
  return useMutation({
    mutationFn: ({ task, files }: { task: TaskCreate; files?: File[] }) =>
      assignTaskService.createTask(task, files),
    onSuccess: async () => {
      toast.success("Task created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create task"),
  });
};

export const useUpdateAssignedTask = () => {
  return useMutation({
    mutationFn: ({
      guid,
      data,
      files,
      strRemoveDocumentAssociationGUIDs,
    }: {
      guid: string;
      data: TaskUpdate;
      files?: File[];
      strRemoveDocumentAssociationGUIDs?: string[];
    }) =>
      assignTaskService.updateTask(
        guid,
        data,
        files,
        strRemoveDocumentAssociationGUIDs
      ),
    onSuccess: async () => {
      toast.success("Task updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update task"),
  });
};

export const useDeleteAssignedTask = () => {
  return useMutation({
    mutationFn: ({ guid }: { guid: string }) =>
      assignTaskService.deleteTask(guid),
    onSuccess: async () => {
      toast.success("Task deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete task"),
  });
};
