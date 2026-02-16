import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  TaskComment,
  TaskCommentSimple,
  CreateTaskComment,
  UpdateTaskComment,
  LikeComment,
} from "@/types/task/task-comment";

export const taskCommentService = {
  createComment: async (
    data: CreateTaskComment
  ): Promise<TaskCommentSimple> => {
    return await ApiService.post<TaskCommentSimple>(
      `${TASK_API_PREFIX}/TaskComment`,
      data
    );
  },

  getCommentsByTask: async (taskGuid: string): Promise<TaskComment[]> => {
    return await ApiService.getArray<TaskComment>(
      `${TASK_API_PREFIX}/TaskComment/task/${taskGuid}`
    );
  },

  updateComment: async (
    commentGuid: string,
    data: UpdateTaskComment
  ): Promise<TaskCommentSimple> => {
    return await ApiService.put<TaskCommentSimple>(
      `${TASK_API_PREFIX}/TaskComment/${commentGuid}`,
      data
    );
  },

  deleteComment: async (commentGuid: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/TaskComment/${commentGuid}`
    );
  },

  likeComment: async (
    commentGuid: string,
    payload: LikeComment
  ): Promise<TaskCommentSimple> => {
    return await ApiService.post<TaskCommentSimple>(
      `${TASK_API_PREFIX}/TaskComment/${commentGuid}/like`,
      payload
    );
  },
};
