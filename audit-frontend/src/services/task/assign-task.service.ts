import { api } from "@/lib/api/axios";
import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  Task,
  TaskCreate,
  TaskUpdate,
  AssignedByMeParams,
  AssignedByMeTaskListItem,
} from "@/types/task/task";
import type { ApiResponse, BackendPagedResponse } from "@/types";

export const assignTaskService = {
  getTasksAssignedByMe: async (
    params: AssignedByMeParams = {}
  ): Promise<BackendPagedResponse<AssignedByMeTaskListItem[]>> => {
    return await ApiService.getWithMeta<
      BackendPagedResponse<AssignedByMeTaskListItem[]>
    >(
      `${TASK_API_PREFIX}/AssignTask/assigned-by/me`,
      params as Record<string, unknown>
    );
  },

  getTask: async (guid: string): Promise<Task> => {
    const task = await ApiService.get<
      Task & { strSubModuleGUID?: string | null }
    >(`${TASK_API_PREFIX}/AssignTask/${guid}`);
    return {
      ...task,
      // Normalize legacy field name for sub-module selection in edit mode.
      strBoardSubModuleGUID:
        task.strBoardSubModuleGUID ?? task.strSubModuleGUID ?? null,
    };
  },

  createTask: async (
    task: TaskCreate,
    files?: File[]
  ): Promise<Task | null> => {
    const formData = new FormData();
    formData.append("taskData", JSON.stringify(task));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    const response = await api.post<ApiResponse<Task | null>>(
      `${TASK_API_PREFIX}/AssignTask`,
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
    guid: string,
    task: TaskUpdate,
    files?: File[],
    strRemoveDocumentAssociationGUIDs?: string[]
  ): Promise<Task> => {
    const formData = new FormData();
    formData.append("taskData", JSON.stringify(task));

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
      `${TASK_API_PREFIX}/AssignTask/${guid}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  deleteTask: async (guid: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/AssignTask/${guid}`
    );
  },
};
