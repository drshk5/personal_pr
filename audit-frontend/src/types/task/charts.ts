export type GuidString = string;

export interface ChartFilterRequest {
  strBoardGUID: GuidString;
  strUserGUID?: GuidString | null;
  dtFromDate?: string | null;
  dtToDate?: string | null;
  strDateRange?: string;
  pageNumber?: number;
  pageSize?: number;
  search?: string | null;
  sortBy?: string | null;
  ascending?: boolean;
}

export interface LeaderboardItemDto {
  strUserGUID: GuidString;
  strUserName: string;
  decBillableAmountInBaseCurrency: number;
  decBillableAmountInRateCurrency: number;
  strRateCurrencyCode: string;
  strBaseCurrencyCode: string;
  strTotalBillableHours: string;
  intBillableTasks: number;
}

export interface WorkloadHeatmapItemDto {
  strUserGUID: GuidString;
  strUserName: string;
  dtTaskDate: string;
  strTotalBillableHours: string;
  intTotalMinutes: number;
}

export interface RateCoverageItemDto {
  dtTaskDate: string;
  intTasksWithRate: number;
  intTasksWithoutRate: number;
  strHoursWithRate: string;
  strHoursWithoutRate: string;
}

export interface TaskAgingItemDto {
  strBoardGUID: GuidString;
  strBoardName: string;
  intOpen: number;
  intOverdue: number;
}

export interface TopTaskEffortItemDto {
  strTaskGUID: GuidString;
  strTaskTitle: string;
  strTotalBillableHours: string;
  intTotalMinutes: number;
  decAmountInBaseCurrency: number;
}

export interface UserCompletionStatsDto {
  strUserGUID: GuidString;
  strUserName: string;
  intCompletedTasks: number;
}
