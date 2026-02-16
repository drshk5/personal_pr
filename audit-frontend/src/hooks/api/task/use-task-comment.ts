import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  TaskComment,
  CreateTaskComment,
  UpdateTaskComment,
  LikeComment,
} from "@/types/task/task-comment";
import { taskCommentService } from "@/services/task/task-comment.service";

export const taskCommentQueryKeys = createQueryKeys("taskComments");

export const useTaskComments = (taskGuid?: string) => {
  return useQuery<TaskComment[]>({
    queryKey: [...taskCommentQueryKeys.all, "by-task", taskGuid || ""],
    queryFn: async () => {
      return await taskCommentService.getCommentsByTask(taskGuid!);
    },
    enabled: !!taskGuid,
  });
};

export const useCreateTaskComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskComment) =>
      taskCommentService.createComment(data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...taskCommentQueryKeys.all,
          "by-task",
          variables.strTaskGUID,
        ],
      });
      toast.success("Comment added successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to add comment"),
  });
};

export const useUpdateTaskComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentGuid,
      data,
    }: {
      commentGuid: string;
      data: UpdateTaskComment;
    }) => taskCommentService.updateComment(commentGuid, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: taskCommentQueryKeys.all,
      });
      toast.success("Comment updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update comment"),
  });
};

export const useDeleteTaskComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentGuid }: { commentGuid: string; taskGuid: string }) =>
      taskCommentService.deleteComment(commentGuid),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: taskCommentQueryKeys.all,
      });
      toast.success("Comment deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete comment"),
  });
};

export const useLikeTaskComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentGuid,
      payload,
    }: {
      commentGuid: string;
      payload: LikeComment;
    }) => taskCommentService.likeComment(commentGuid, payload),
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: taskCommentQueryKeys.all });
      },
    onError: (error) => handleMutationError(error, "Failed to update reaction"),
  });
};
