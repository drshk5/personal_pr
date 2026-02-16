import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  AddReviewDto,
  UpdateReviewDto,
  PendingReviewTaskParams,
  PendingReviewTask,
} from "@/types/task/review-task";
import { reviewTaskService } from "@/services/task/review-task.service";
import { taskQueryKeys } from "./use-task";
import type { TaskCreate, TaskUpdate } from "@/types/task/task";
import type { BackendPagedResponse } from "@/types";

export const reviewTaskQueryKeys = createQueryKeys("reviewTasks");

export const useReviewsByTask = (taskGuid?: string) => {
  return useQuery({
    queryKey: reviewTaskQueryKeys.list({ taskGuid: taskGuid || "" }),
    queryFn: () => reviewTaskService.getReviewsByTask(taskGuid!),
    enabled: !!taskGuid,
  });
};

export const useAddReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: AddReviewDto) => reviewTaskService.addReview(review),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewTaskQueryKeys.list({ taskGuid: variables.strTaskGUID }),
      });
      queryClient.invalidateQueries({
        queryKey: [...reviewTaskQueryKeys.all, "task", variables.strTaskGUID],
      });
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["taskViewPositions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["assignTasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-timer"] });
      toast.success("Review added successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to add review"),
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewTaskGuid,
      data,
    }: {
      reviewTaskGuid: string;
      data: UpdateReviewDto;
    }) => reviewTaskService.updateReview(reviewTaskGuid, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...reviewTaskQueryKeys.all, "task", variables.reviewTaskGuid],
      });
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: reviewTaskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["taskViewPositions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["assignTasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-timer"] });
      toast.success("Review updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update review"),
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewTaskGuid }: { reviewTaskGuid: string }) =>
      reviewTaskService.deleteReview(reviewTaskGuid),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...reviewTaskQueryKeys.all, "task", variables.reviewTaskGuid],
      });
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: reviewTaskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["taskViewPositions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["assignTasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-timer"] });
      toast.success("Review deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete review"),
  });
};

// Pending review tasks hook (uses ReviewTask endpoint)
export const useReviewModulePendingTasks = (
  params: PendingReviewTaskParams
) => {
  return useQuery<BackendPagedResponse<PendingReviewTask[]>>({
    queryKey: [...reviewTaskQueryKeys.all, "review-module-pending", params],
    queryFn: () => reviewTaskService.getPendingReviewTasksByMe(params),
    placeholderData: (previousData) => previousData,
  });
};

// Task CRUD hooks within review module context
export const useCreateReviewTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ task, files }: { task: TaskCreate; files?: File[] }) =>
      reviewTaskService.createTask(task, files),
    onSuccess: async () => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: reviewTaskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["taskViewPositions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["assignTasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-timer"] });
      toast.success("Task created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create task"),
  });
};

export const useUpdateReviewTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskGuid,
      data,
      files,
      strRemoveDocumentAssociationGUIDs,
    }: {
      taskGuid: string;
      data: TaskUpdate;
      files?: File[];
      strRemoveDocumentAssociationGUIDs?: string[];
    }) =>
      reviewTaskService.updateTask(
        taskGuid,
        data,
        files,
        strRemoveDocumentAssociationGUIDs
      ),
    onSuccess: async (_, variables) => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: reviewTaskQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.detail(variables.taskGuid),
      });
      queryClient.invalidateQueries({ queryKey: ["taskViewPositions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["assignTasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-timer"] });
      toast.success("Task updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update task"),
  });
};

export const useReviewTask = (taskGuid?: string) => {
  return useQuery({
    queryKey: [...reviewTaskQueryKeys.all, "task", taskGuid || ""],
    queryFn: () => reviewTaskService.getTask(taskGuid!),
    enabled: !!taskGuid,
  });
};

export const useDeleteReviewTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskGuid }: { taskGuid: string }) =>
      reviewTaskService.deleteTask(taskGuid),
    onSuccess: async () => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: reviewTaskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["taskViewPositions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["assignTasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-timer"] });
      toast.success("Task deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete task"),
  });
};
