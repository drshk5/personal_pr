import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";

import type {
  Notification,
  NotificationCreate,
  NotificationParams,
  NotificationListResponse,
} from "@/types/task/notification";

export const notificationService = {
  getNotifications: async (
    params: NotificationParams = {}
  ): Promise<NotificationListResponse> => {
    return await ApiService.getWithMeta<NotificationListResponse>(
      `${TASK_API_PREFIX}/Notification`,
      params as Record<string, unknown>
    );
  },

  getNotification: async (guid: string): Promise<Notification> => {
    return await ApiService.get<Notification>(
      `${TASK_API_PREFIX}/Notification/${guid}`
    );
  },

  getUnreadCount: async (): Promise<number> => {
    return await ApiService.get<number>(
      `${TASK_API_PREFIX}/Notification/unread-count`
    );
  },

  createNotification: async (
    data: NotificationCreate
  ): Promise<Notification> => {
    return await ApiService.post<Notification>(
      `${TASK_API_PREFIX}/Notification`,
      data
    );
  },

  markAsRead: async (guid: string): Promise<boolean> => {
    return await ApiService.put<boolean>(
      `${TASK_API_PREFIX}/Notification/${guid}/mark-read`,
      {}
    );
  },

  markAllAsRead: async (): Promise<boolean> => {
    return await ApiService.put<boolean>(
      `${TASK_API_PREFIX}/Notification/mark-all-read`,
      {}
    );
  },

  deleteNotification: async (guid: string): Promise<boolean> => {
    return await ApiService.delete<boolean>(
      `${TASK_API_PREFIX}/Notification/${guid}`
    );
  },
};
