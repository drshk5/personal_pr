import axios from "axios";
import { api } from "@/lib/api/axios";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import { environment } from "@/config/environment";
import type {
  TaskColumnMapping,
  ExcelPreviewData,
  ImportInitiatedResponse,
  ImportProgress,
  ImportError,
  ImportSummaryItem,
  ImportStatusDto,
} from "@/types/task/task-import";
import type { ApiResponse, BackendPagedResponse } from "@/types";

export type ExcelPreviewResponse = ApiResponse<ExcelPreviewData>;
export type ImportInitiatedResponseType = ApiResponse<ImportInitiatedResponse>;
export type ImportProgressResponse = ApiResponse<ImportProgress>;
export type ImportErrorsResponse = ApiResponse<ImportError[]>;
export type ImportStopResponse = ApiResponse<string>;
export type ImportStatisticsResponse = BackendPagedResponse<
  ImportSummaryItem[]
>;
export type ImportStatusResponse = ApiResponse<ImportStatusDto>;

/**
 * Hub-Backend API instance (Points to hub-backend on port 7007)
 * Used for task import operations: preview, import, stop, status
 */
const hubApi = axios.create({
  baseURL: `${environment.hubUrl}/api`,
  withCredentials: true,
});

// Add token to hub-backend requests
hubApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("Token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const taskImportService = {
  previewExcel: async (file: File): Promise<ExcelPreviewResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await hubApi.post<ExcelPreviewResponse>(
      `/task/TaskImport/preview`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  importTasks: async (
    file: File,
    columnMapping?: TaskColumnMapping
  ): Promise<ImportInitiatedResponseType> => {
    const formData = new FormData();
    formData.append("file", file);

    if (columnMapping) {
      formData.append("columnMapping", JSON.stringify(columnMapping));
    }

    const response = await hubApi.post<ImportInitiatedResponseType>(
      `/task/TaskImport/excel`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Get import progress by ID (task-backend)
   */
  getImportProgress: async (
    importId: string
  ): Promise<ImportProgressResponse> => {
    const response = await api.get<ImportProgressResponse>(
      `${TASK_API_PREFIX}/TaskImport/progress/${importId}`
    );
    return response.data;
  },

  /**
   * Get detailed errors for a specific import (task-backend)
   */
  getImportErrors: async (importId: string): Promise<ImportErrorsResponse> => {
    const response = await api.get<ImportErrorsResponse>(
      `${TASK_API_PREFIX}/TaskImport/errors/${importId}`
    );
    return response.data;
  },

  /**
   * Stop/Cancel an ongoing import operation (hub-backend)
   */
  stopImport: async (importId: string): Promise<ImportStopResponse> => {
    const response = await hubApi.post<ImportStopResponse>(
      `/task/TaskImport/stop/${importId}`,
      {}
    );
    return response.data;
  },

  /**
   * Get import status from hub-backend (persists across sessions)
   */
  getImportStatus: async (importId: string): Promise<ImportStatusResponse> => {
    const response = await hubApi.get<ImportStatusResponse>(
      `/task/TaskImport/status/${importId}`
    );
    return response.data;
  },

  /**
   * Get historical import statistics from task-backend
   */
  getImportStatistics: async (
    pageNumber = 1,
    pageSize = 20,
    search?: string
  ): Promise<ImportStatisticsResponse> => {
    const params = new URLSearchParams();
    params.append("pageNumber", String(pageNumber));
    params.append("pageSize", String(pageSize));
    if (search) params.append("search", search);

    const response = await api.get<ImportStatisticsResponse>(
      `${TASK_API_PREFIX}/TaskImport/statistics?${params.toString()}`
    );
    return response.data;
  },
};
