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

export const activityService = {
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

  // ── Create (immutable — no update/delete) ───────────────────
  createActivity: async (dto: CreateActivityDto): Promise<ActivityListDto> => {
    return await ApiService.post<ActivityListDto>(ACTIVITIES_PREFIX, dto);
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

  // ── Upcoming scheduled activities ───────────────────────────
  getUpcoming: async (): Promise<UpcomingActivityDto[]> => {
    return await ApiService.getArray<UpcomingActivityDto>(
      `${ACTIVITIES_PREFIX}/upcoming`
    );
  },
  // ── Bulk notify activities ──────────────────────────────────────
  bulkNotify: async (dto: {
    activityGuids: string[];
    message: string;
    notifyAssignedUsers: boolean;
  }): Promise<void> => {
    await ApiService.post(`${ACTIVITIES_PREFIX}/bulk-notify`, {
      ActivityGuids: dto.activityGuids,
      Message: dto.message,
      NotifyAssignedUsers: dto.notifyAssignedUsers,
    });
  },

  // ── Bulk email activities ───────────────────────────────────────
  bulkEmail: async (dto: {
    activityGuids: string[];
    subject: string;
    body: string;
    sendToAssignedUsers: boolean;
    sendToCreators: boolean;
    additionalRecipients: string[];
  }): Promise<number> => {
    const response = await ApiService.post<number>(
      `${ACTIVITIES_PREFIX}/bulk-email`,
      {
        ActivityGuids: dto.activityGuids,
        Subject: dto.subject,
        Body: dto.body,
        SendToAssignedUsers: dto.sendToAssignedUsers,
        SendToCreators: dto.sendToCreators,
        AdditionalRecipients: dto.additionalRecipients,
      }
    );
    return response;
  },
};
