import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { CRM_API_PREFIX } from "@/constants/api-prefix";
import type {
  CreateActivityDto,
  ActivityListDto,
  ActivityFilterParams,
  ActivityListResponse,
  UpcomingActivityDto,
} from "@/types/CRM/activity";

const ACTIVITIES_PREFIX = `${CRM_API_PREFIX}/activities`;

export const activityExtendedService = {
  // ── List (paged + filtered) ─────────────────────────────────
  getActivities: async (
    params: ActivityFilterParams = {}
  ): Promise<ActivityListResponse> => {
    return await ApiService.getWithMeta<ActivityListResponse>(
      ACTIVITIES_PREFIX,
      formatPaginationParams({ ...params })
    );
  },

  // ── Single Detail ───────────────────────────────────────────
  getActivity: async (id: string): Promise<ActivityListDto> => {
    return await ApiService.get<ActivityListDto>(`${ACTIVITIES_PREFIX}/${id}`);
  },

  // ── Create Activity ────────────────────────────────────────
  createActivity: async (dto: CreateActivityDto): Promise<ActivityListDto> => {
    return await ApiService.post<ActivityListDto>(ACTIVITIES_PREFIX, dto);
  },

  // ── Update Activity ────────────────────────────────────────
  updateActivity: async (
    id: string,
    dto: CreateActivityDto
  ): Promise<ActivityListDto> => {
    return await ApiService.put<ActivityListDto>(
      `${ACTIVITIES_PREFIX}/${id}`,
      dto
    );
  },

  // ── Delete Activity ────────────────────────────────────────
  deleteActivity: async (id: string): Promise<void> => {
    return await ApiService.delete(`${ACTIVITIES_PREFIX}/${id}`);
  },

  // ── Change Activity Status ───────────────────────────────────
  changeStatus: async (
    id: string,
    status: string
  ): Promise<ActivityListDto> => {
    return await ApiService.patch<ActivityListDto>(
      `${ACTIVITIES_PREFIX}/${id}/status`,
      { status }
    );
  },

  // ── Assign Activity to User ──────────────────────────────────
  assignActivity: async (
    id: string,
    userId: string
  ): Promise<ActivityListDto> => {
    return await ApiService.patch<ActivityListDto>(
      `${ACTIVITIES_PREFIX}/${id}/assign`,
      { userId }
    );
  },

  // ── Bulk Operations ──────────────────────────────────────────
  bulkAssign: async (ids: string[], userId: string): Promise<boolean> => {
    return await ApiService.post<boolean>(
      `${ACTIVITIES_PREFIX}/bulk-assign`,
      { guids: ids, userId }
    );
  },

  bulkChangeStatus: async (ids: string[], status: string): Promise<boolean> => {
    return await ApiService.post<boolean>(
      `${ACTIVITIES_PREFIX}/bulk-status`,
      { guids: ids, status }
    );
  },

  bulkDelete: async (ids: string[]): Promise<boolean> => {
    return await ApiService.post<boolean>(`${ACTIVITIES_PREFIX}/bulk-delete`, {
      guids: ids,
    });
  },

  // ── Today's Activities ───────────────────────────────────────
  getTodayActivities: async (): Promise<ActivityListDto[]> => {
    return await ApiService.getArray<ActivityListDto>(
      `${ACTIVITIES_PREFIX}/today`
    );
  },

  // ── My Activities ───────────────────────────────────────────
  getMyActivities: async (
    params: ActivityFilterParams = {}
  ): Promise<ActivityListResponse> => {
    return await ApiService.getWithMeta<ActivityListResponse>(
      `${ACTIVITIES_PREFIX}/my-activities`,
      formatPaginationParams({ ...params })
    );
  },

  // ── Overdue Activities ───────────────────────────────────────
  getOverdueActivities: async (
    params: ActivityFilterParams = {}
  ): Promise<ActivityListResponse> => {
    return await ApiService.getWithMeta<ActivityListResponse>(
      `${ACTIVITIES_PREFIX}/overdue`,
      formatPaginationParams({ ...params })
    );
  },

  // ── Upcoming scheduled activities ───────────────────────────
  getUpcoming: async (): Promise<UpcomingActivityDto[]> => {
    return await ApiService.getArray<UpcomingActivityDto>(
      `${ACTIVITIES_PREFIX}/upcoming`
    );
  },

  // ── Entity-scoped activities ────────────────────────────────
  getEntityActivities: async (
    entityType: string,
    entityId: string,
    params: ActivityFilterParams = {}
  ): Promise<ActivityListResponse> => {
    return await ApiService.getWithMeta<ActivityListResponse>(
      `${ACTIVITIES_PREFIX}/entity/${entityType}/${entityId}`,
      formatPaginationParams({ ...params })
    );
  },
};
