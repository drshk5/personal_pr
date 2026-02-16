import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type { BackendPagedResponse } from "@/types";
import type {
  TaskCreate,
  TaskParams,
  MyTaskParams,
  MyTaskListItem,
  BoardTaskParams,
  TaskListItem,
  TaskUpdate,
  TaskViewPositionCreate,
  TaskViewPositionParams,
  TaskViewPositionUpdate,
  MoveTaskRequest,
  ReorderTasksRequest,
  DuplicateTaskRequest,
  PaginatedTaskResponse,
  BulkTaskCreateRequest,
} from "@/types/task/task";
import { taskService } from "@/services/task/task.service";
import { taskViewPositionService } from "@/services/task/task-view-position.service";

export const taskQueryKeys = createQueryKeys("tasks");
export const taskViewPositionQueryKeys = createQueryKeys("taskViewPositions");

export const useTasks = (params?: TaskParams) => {
  return useQuery({
    queryKey: taskQueryKeys.list(params || {}),
    queryFn: () => taskService.getTasks(params),
  });
};

export const useAllTasks = (
  params?: TaskParams,
  options?: Omit<UseQueryOptions<PaginatedTaskResponse>, "queryKey" | "queryFn">
): UseQueryResult<PaginatedTaskResponse> => {
  return useQuery<PaginatedTaskResponse>({
    queryKey: [...taskQueryKeys.all, "all-tasks", params || {}],
    queryFn: () => taskService.getAllTasks(params),
    ...options,
  });
};

export const useMyTasks = (
  params?: MyTaskParams,
  options?: Omit<
    UseQueryOptions<BackendPagedResponse<MyTaskListItem[]>>,
    "queryKey" | "queryFn"
  >
): UseQueryResult<BackendPagedResponse<MyTaskListItem[]>> => {
  return useQuery<BackendPagedResponse<MyTaskListItem[]>>({
    queryKey: [...taskQueryKeys.all, "my-tasks", params || {}],
    queryFn: () => taskService.getMyTasks(params),
    ...options,
  });
};

export const useBoardTasks = (
  params?: BoardTaskParams,
  options?: Omit<
    UseQueryOptions<BackendPagedResponse<TaskListItem[]>>,
    "queryKey" | "queryFn"
  >
): UseQueryResult<BackendPagedResponse<TaskListItem[]>> => {
  return useQuery<BackendPagedResponse<TaskListItem[]>>({
    queryKey: [...taskQueryKeys.all, "board-tasks", params || {}],
    queryFn: () => taskService.getBoardTasks(params!),
    enabled: !!params?.strBoardGUID,
    ...options,
  });
};

export const useTask = (id?: string) => {
  return useQuery({
    queryKey: taskQueryKeys.detail(id || ""),
    queryFn: () => taskService.getTask(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
  });
};

export const useCreateTask = () => {
  return useMutation({
    mutationFn: ({ task, files }: { task: TaskCreate; files?: File[] }) =>
      taskService.createTask(task, files),
    onSuccess: async () => {
      toast.success("Task created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create task"),
  });
};

export const useUpdateTask = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
      strRemoveDocumentAssociationGUIDs,
    }: {
      id: string;
      data: TaskUpdate;
      files?: File[];
      strRemoveDocumentAssociationGUIDs?: string[];
    }) =>
      taskService.updateTask(
        id,
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

export const useDeleteTask = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) => taskService.deleteTask(id),
    onSuccess: async () => {
      toast.success("Task deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete task"),
  });
};

export const useTaskViewPositions = (
  params?: TaskViewPositionParams,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: taskViewPositionQueryKeys.list(params || {}),
    queryFn: () => taskViewPositionService.getTaskViewPositions(params),
    ...options,
  });
};

export const useTaskViewPosition = (id?: string) => {
  return useQuery({
    queryKey: taskViewPositionQueryKeys.detail(id || ""),
    queryFn: () => taskViewPositionService.getTaskViewPosition(id!),
    enabled: !!id,
  });
};

export const useCreateTaskViewPosition = () => {
  return useMutation({
    mutationFn: (position: TaskViewPositionCreate) =>
      taskViewPositionService.createTaskViewPosition(position),
    onSuccess: async () => {
      toast.success("Task position created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create task position"),
  });
};

export const useUpdateTaskViewPosition = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskViewPositionUpdate }) =>
      taskViewPositionService.updateTaskViewPosition(id, data),
    onSuccess: async () => {
      toast.success("Task position updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update task position"),
  });
};

export const useDeleteTaskViewPosition = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      taskViewPositionService.deleteTaskViewPosition(id),
    onSuccess: async () => {
      toast.success("Task position deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete task position"),
  });
};

export const useMoveTaskToSection = () => {
  return useMutation({
    mutationFn: (request: MoveTaskRequest) =>
      taskViewPositionService.moveTaskToSection(request),
    onSuccess: async () => {
      toast.success("Task moved successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to move task"),
  });
};

export const useReorderTasksInSection = () => {
  return useMutation({
    mutationFn: (request: ReorderTasksRequest) =>
      taskViewPositionService.reorderTasksInSection(request),
    onSuccess: async () => {
      toast.success("Tasks reordered successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to reorder tasks"),
  });
};

export const useMoveTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskGuid,
      request,
    }: {
      taskGuid: string;
      request: MoveTaskRequest;
    }) => {
      console.log(`[useMoveTask] Starting move for task ${taskGuid}`, request);
      return taskService.moveTask(taskGuid, request);
    },
    onSuccess: async () => {
      console.log("[useMoveTask] Move successful, invalidating queries");
      // Invalidate tasks queries to refresh the list
      await queryClient.invalidateQueries({
        queryKey: taskQueryKeys.all,
      });
      // Invalidate task view positions to update positions
      await queryClient.invalidateQueries({
        queryKey: taskViewPositionQueryKeys.all,
      });
      console.log("[useMoveTask] Queries invalidated successfully");
      toast.success("Task moved successfully");
    },
    onError: (error) => {
      console.error("[useMoveTask] Error occurred:", error);
      handleMutationError(error, "Failed to move task");
    },
  });
};

export const useDuplicateTask = () => {
  return useMutation({
    mutationFn: ({
      taskGuid,
      request,
    }: {
      taskGuid: string;
      request: DuplicateTaskRequest;
    }) => taskService.duplicateTask(taskGuid, request),
    onSuccess: async () => {
      toast.success("Task duplicated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to duplicate task"),
  });
};

export const useBulkCreateTasks = () => {
  return useMutation({
    mutationFn: (request: BulkTaskCreateRequest) =>
      taskService.bulkCreateTasks(request),
    onSuccess: async (response) => {
      const { successfullyCreated, failed } = response || {
        successfullyCreated: 0,
        failed: 0,
      };
      if (failed > 0) {
        toast.success(
          `${successfullyCreated} task(s) created successfully. ${failed} failed.`
        );
      } else {
        toast.success(`${successfullyCreated} task(s) created successfully`);
      }
    },
    onError: (error) =>
      handleMutationError(error, "Failed to bulk create tasks"),
  });
};
