import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  AddReviewDto,
  UpdateReviewDto,
  ReviewTask,
  PendingReviewTaskParams,
  ReviewTaskSimple,
  PendingReviewTask,
  PendingReviewTasksPayload,
} from "@/types/task/review-task";
import type { Task, TaskCreate, TaskUpdate } from "@/types/task/task";
import type { ApiResponse, BackendPagedResponse } from "@/types";

export const reviewTaskService = {
  addReview: async (payload: AddReviewDto): Promise<ReviewTaskSimple> => {
    return await ApiService.post<ReviewTaskSimple>(
      `${TASK_API_PREFIX}/ReviewTask`,
      payload
    );
  },

  getReviewsByTask: async (taskGuid: string): Promise<ReviewTask[]> => {
    return await ApiService.get<ReviewTask[]>(
      `${TASK_API_PREFIX}/ReviewTask/reviews/${taskGuid}`
    );
  },

  updateReview: async (
    reviewTaskGuid: string,
    payload: UpdateReviewDto
  ): Promise<ReviewTaskSimple> => {
    return await ApiService.put<ReviewTaskSimple>(
      `${TASK_API_PREFIX}/ReviewTask/${reviewTaskGuid}`,
      payload
    );
  },

  deleteReview: async (reviewTaskGuid: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/ReviewTask/${reviewTaskGuid}`
    );
  },

  getPendingReviewTasksByMe: async (
    params: PendingReviewTaskParams = {}
  ): Promise<BackendPagedResponse<PendingReviewTask[]>> => {
    const response = await ApiService.getWithMeta<
      | BackendPagedResponse<PendingReviewTask[]>
      | ApiResponse<PendingReviewTasksPayload>
    >(
      `${TASK_API_PREFIX}/ReviewTask/pending-tasks/me`,
      params as Record<string, unknown>
    );

    if ("pageNumber" in response && Array.isArray(response.data)) {
      return response as BackendPagedResponse<PendingReviewTask[]>;
    }

    const payload = (response as ApiResponse<PendingReviewTasksPayload>).data;

    return {
      statusCode: (response as ApiResponse<PendingReviewTasksPayload>)
        .statusCode,
      message: (response as ApiResponse<PendingReviewTasksPayload>).message,
      data: payload.items,
      pageNumber: payload.pageNumber,
      pageSize: payload.pageSize,
      totalPages: payload.totalPages,
      totalRecords: payload.totalCount,
      hasPreviousPage: payload.hasPrevious,
      hasNextPage: payload.hasNext,
    };
  },

  createTask: async (payload: TaskCreate, files?: File[]): Promise<Task> => {
    const formData = new FormData();
    formData.append("taskData", JSON.stringify(payload));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    const response = await api.post<{ data: Task }>(
      `${TASK_API_PREFIX}/ReviewTask/task`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  updateTask: async (
    taskGuid: string,
    payload: TaskUpdate,
    files?: File[],
    strRemoveDocumentAssociationGUIDs?: string[]
  ): Promise<Task> => {
    const formData = new FormData();
    formData.append("taskData", JSON.stringify(payload));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    if (
      strRemoveDocumentAssociationGUIDs &&
      strRemoveDocumentAssociationGUIDs.length > 0
    ) {
      strRemoveDocumentAssociationGUIDs.forEach((guid) =>
        formData.append("strRemoveDocumentAssociationGUIDs", guid)
      );
    }

    const response = await api.put<{ data: Task }>(
      `${TASK_API_PREFIX}/ReviewTask/task/${taskGuid}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  getTask: async (taskGuid: string): Promise<Task> => {
    const task = await ApiService.get<
      Task & { strSubModuleGUID?: string | null }
    >(`${TASK_API_PREFIX}/ReviewTask/task/${taskGuid}`);
    return {
      ...task,
      // Normalize legacy field name for sub-module selection in edit mode.
      strBoardSubModuleGUID:
        task.strBoardSubModuleGUID ?? task.strSubModuleGUID ?? null,
    };
  },

  deleteTask: async (taskGuid: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/ReviewTask/task/${taskGuid}`
    );
  },
};
