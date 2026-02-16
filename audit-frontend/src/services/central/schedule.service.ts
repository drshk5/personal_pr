import { ApiService } from "@/lib/api/api-service";
import { api } from "@/lib/api/axios";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Schedule,
  ScheduleCreate,
  ScheduleExportParams,
  ScheduleListResponse,
  ScheduleParams,
  ScheduleSimple,
  ScheduleTree,
  ScheduleUpdate,
  ImportScheduleResult,
} from "@/types/central/schedule";

const SCHEDULE_BASE_PATH = "/schedule";

export const scheduleService = {
  getSchedules: async (
    params: ScheduleParams = {}
  ): Promise<ScheduleListResponse> => {
    return await ApiService.getWithMeta<ScheduleListResponse>(
      SCHEDULE_BASE_PATH,
      formatPaginationParams({
        ...params,
        sortBy: params.sortBy || "strScheduleCode",
        bolIsActive: params.bolIsActive,
        bolIsEditable: params.bolIsEditable,
        ParentScheduleGUIDs: params.ParentScheduleGUIDs,
        DefaultAccountTypeGUIDs: params.DefaultAccountTypeGUIDs,
        createdByGUIDs: params.createdByGUIDs,
        updatedByGUIDs: params.updatedByGUIDs,
      })
    );
  },

  getSchedule: async (id: string): Promise<Schedule> => {
    return await ApiService.get<Schedule>(`${SCHEDULE_BASE_PATH}/${id}`);
  },

  createSchedule: async (schedule: ScheduleCreate): Promise<Schedule> => {
    return await ApiService.post<Schedule>(SCHEDULE_BASE_PATH, schedule);
  },

  updateSchedule: async (
    id: string,
    schedule: ScheduleUpdate
  ): Promise<Schedule> => {
    return await ApiService.put<Schedule>(
      `${SCHEDULE_BASE_PATH}/${id}`,
      schedule
    );
  },

  deleteSchedule: async (id: string): Promise<void> => {
    return await ApiService.delete(`${SCHEDULE_BASE_PATH}/${id}`);
  },

  getActiveSchedules: async (search?: string): Promise<ScheduleSimple[]> => {
    const params = search ? { search } : {};
    return await ApiService.get<ScheduleSimple[]>(
      `${SCHEDULE_BASE_PATH}/active`,
      params
    );
  },

  exportSchedules: async (params: ScheduleExportParams): Promise<Blob> => {
    if (params.format === "excel") {
      const response = await api.get(`/Schedule/export/excel`, {
        responseType: "blob",
        headers: { Accept: "*/*" },
      });
      return response.data;
    } else {
      return await ApiService.exportFile(
        `${SCHEDULE_BASE_PATH}/export`,
        {},
        params.format
      );
    }
  },

  importSchedules: async (file: File): Promise<ImportScheduleResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await ApiService.post<ImportScheduleResult>(
      `${SCHEDULE_BASE_PATH}/import`,
      formData
    );
    return response;
  },

  getActiveScheduleTree: async (): Promise<ScheduleTree[]> => {
    return await ApiService.get<ScheduleTree[]>(
      `${SCHEDULE_BASE_PATH}/tree/active`
    );
  },

  exportActiveScheduleTreeToPdf: async (): Promise<Blob> => {
    const response = await api.get(`${SCHEDULE_BASE_PATH}/export/pdf`, {
      responseType: "blob",
      headers: {
        Accept: "*/*",
      },
    });
    return response.data;
  },

  exportActiveScheduleTreeToExcel: async (): Promise<Blob> => {
    const response = await api.get(`${SCHEDULE_BASE_PATH}/export/excel`, {
      responseType: "blob",
      headers: {
        Accept: "*/*",
      },
    });
    return response.data;
  },
};
