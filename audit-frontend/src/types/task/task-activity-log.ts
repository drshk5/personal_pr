import type { ApiResponse } from "@/types";

export interface TaskActivityLog {
  strTaskActivityLogGUID: string;
  strUserGUID: string;
  strUserName: string | null;
  strProfileImg: string | null;
  strActivityType: string;
  strDetails: string | null;
  dtActivityTime: string;
  dtCreatedOn: string;
}

export interface GetActivityLogsRequest {
  strTaskGUID: string;
}

export type TaskActivityLogListResponse = ApiResponse<TaskActivityLog[]>;
