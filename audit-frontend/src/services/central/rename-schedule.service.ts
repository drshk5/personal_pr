import { ApiService } from "@/lib/api/api-service";

import type {
  RenameScheduleListResponse,
  RenameScheduleResponse,
  RenameScheduleUpsert,
  RenameScheduleUpdate,
} from "@/types/central/rename-schedule";

interface RenameScheduleParams {
  search?: string;
}

const RENAME_SCHEDULE_BASE_PATH = "/renameschedule";

export const renameScheduleService = {
  getRenameSchedules: async (
    params: RenameScheduleParams = {}
  ): Promise<RenameScheduleListResponse> => {
    // Only include search if it has a value
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== ""
      )
    );
    return await ApiService.getWithMeta<RenameScheduleListResponse>(
      RENAME_SCHEDULE_BASE_PATH,
      filteredParams
    );
  },

  getRenameSchedule: async (id: string): Promise<RenameScheduleResponse> => {
    return await ApiService.get<RenameScheduleResponse>(
      `${RENAME_SCHEDULE_BASE_PATH}/${id}`
    );
  },

  upsertRenameSchedule: async (renameSchedule: RenameScheduleUpsert) => {
    return await ApiService.postWithMeta(
      `${RENAME_SCHEDULE_BASE_PATH}/upsert`,
      renameSchedule
    );
  },

  updateRenameSchedule: async (
    id: string,
    renameSchedule: RenameScheduleUpdate
  ) => {
    return await ApiService.put<RenameScheduleResponse>(
      `${RENAME_SCHEDULE_BASE_PATH}/${id}`,
      renameSchedule
    );
  },

  deleteRenameSchedule: async (id: string) => {
    return await ApiService.deleteWithMeta(
      `${RENAME_SCHEDULE_BASE_PATH}/${id}`
    );
  },
};
