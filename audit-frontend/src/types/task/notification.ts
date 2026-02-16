import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface Notification {
  strNotificationGUID: string;
  strUserGUID: string;
  strUserName?: string;
  strFromUserGUID?: string;
  strFromUserName?: string;
  strTaskGUID?: string;
  strTaskTitle?: string;
  strBoardGUID?: string;
  strBoardName?: string;
  strNotificationType: string;
  strTitle: string;
  strMessage: string;
  bIsRead: boolean;
  dReadOn?: string;
  dtCreatedOn: string;
  strOrganizationGUID: string;
  strYearGUID: string;
}

export interface NotificationSimple {
  strNotificationGUID: string;
  strTitle: string;
  strMessage: string;
  bIsRead: boolean;
}

export interface NotificationParams extends BaseListParams {
  bIsRead?: boolean;
  strNotificationType?: string;
  strBoardGUID?: string;
}

export interface NotificationCreate {
  strUserGUID: string;
  strFromUserGUID?: string;
  strTaskGUID?: string;
  strBoardGUID?: string;
  strNotificationType: string;
  strTitle: string;
  strMessage: string;
}

export interface NotificationUpdate {
  bIsRead?: boolean;
}

export interface NotificationUpdateDto {
  unreadCount: number;
  lastNotification: Notification | null;
}

export type NotificationListResponse = BackendPagedResponse<Notification[]>;
