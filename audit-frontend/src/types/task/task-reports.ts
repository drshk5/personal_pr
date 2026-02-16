import type {
  ApiResponse,
  BaseListParams,
  BackendPagedResponse,
} from "@/types";

// User Daily Work Summary
export interface UserDailyWorkSummaryParams extends BaseListParams {
  strUserGUID?: string;
  strBoardGUID?: string;
  dtFromDate?: string;
  dtToDate?: string;
}

export interface UserDailyWorkSummary {
  strUserName: string;
  strBoardName: string;
  dtDate: string;
  strTotalWorkingHours: string;
  intTotalTasks: number;
  intBillableTasks: number;
  intNonBillableTasks: number;
}

export type UserDailyWorkSummaryResponse = BackendPagedResponse<
  UserDailyWorkSummary[]
>;

// User Board Billable Summary
export interface UserBoardBillableSummaryParams extends BaseListParams {
  strUserGUID?: string;
  strBoardGUID: string;
  dtFromDate?: string;
  dtToDate?: string;
}

export interface UserBoardBillableSummary {
  strUserGUID: string;
  strUserName: string;
  strBoardGUID: string;
  strBoardName: string;
  dtTaskDate: string;
  intBillableTasks: number;
  intTasksWithoutRate: number;
  strTotalBillableHours: string;
  strRateCurrencyCode: string;
  decBillableAmountInRateCurrency: number;
  strBaseCurrencyCode: string;
  decBillableAmountInBaseCurrency: number;
  decExchangeRate: number;
  decTotalBillableAmount: number;
}

export type UserBoardBillableSummaryResponse = BackendPagedResponse<
  UserBoardBillableSummary[]
>;

// User Board Billable Detail
export type UserBoardBillableDetailParams = UserBoardBillableSummaryParams;

export interface UserBoardBillableDetailTask {
  strTaskGUID: string;
  strTaskTitle: string;
  intEntryCount: number;
  intTotalMinutes: number;
  strTotalHours: string;
  strRateCurrencyCode: string;
  strBaseCurrencyCode: string;
  decAmountInRateCurrency: number;
  decAmountInBaseCurrency: number;
  strTicketKey?: string;
  strTicketUrl?: string;
  strTicketSource?: string;
}

export interface UserBoardBillableDetail {
  strUserGUID: string;
  strUserName: string;
  strBoardGUID: string;
  strBoardName: string;
  dtTaskDate: string;
  intTasksCount: number;
  strTotalBillableHours: string;
  intTasksWithoutRate: number;
  strRateCurrencyCode: string;
  strBaseCurrencyCode: string;
  decExchangeRate: number;
  decAmountInRateCurrency: number;
  decAmountInBaseCurrency: number;
  tasks: UserBoardBillableDetailTask[];
}

export type UserBoardBillableDetailResponse = BackendPagedResponse<
  UserBoardBillableDetail[]
>;

// User Performance Report
export interface UserPerformanceReportParams extends BaseListParams {
  strUserGUID?: string;
  strBoardGUID?: string;
  strBoardSectionGUID?: string;
  strBoardSubModuleGUID?: string;
  dtFromDate?: string;
  dtToDate?: string;
}

export interface UserPerformanceReportItem {
  strUserGUID: string;
  strUserName: string;
  strBoardGUID?: string | null;
  strBoardSectionGUID?: string | null;
  strBoardSubModuleGUID?: string | null;
  strBoardSubModuleName?: string | null;
  intTaskNo: number;
  strTaskGUID: string;
  strTaskTitle: string;
  strBoardName: string;
  strBoardSectionName: string;
  bolIsBillable: boolean;
  intTotalTimerCount: number;
  intTotalMinutes: number;
  strTotalHours: string;
  strTicketKey: string;
  strTicketUrl: string;
  strTicketSource: string;
}

export interface UserPerformanceUserSummary {
  strUserGUID: string;
  strUserName: string;
  intBillableTaskCount: number;
  intNonBillableTaskCount: number;
  intBillableMinutes: number;
  intNonBillableMinutes: number;
  strBillableHours: string;
  strNonBillableHours: string;
}

export type UserPerformanceReport = BackendPagedResponse<
  UserPerformanceReportItem[]
>;

// Boardwise Summary Report
export interface BoardwiseSummaryParams {
  strBoardGUID?: string;
  strBoardSectionGUID?: string;
  strBoardSubModuleGUID?: string;
  dtFromDate?: string;
  dtToDate?: string;
}

export interface BoardwiseTaskSummary {
  strTaskGUID: string;
  intTaskNo: number;
  strTaskName: string;
  strBoardSectionGUID?: string | null;
  strBoardSectionName?: string | null;
  strBoardSubModuleGUID?: string | null;
  strBoardSubModuleName?: string | null;
  strTicketKey?: string | null;
  strTicketUrl?: string | null;
  strTicketSource?: string | null;
  dblBillableHours: number;
  dblNonBillableHours: number;
  strBillableHours: string;
  strNonBillableHours: string;
}

export interface BoardwiseTotalSummary {
  dblTotalBillableHours: number;
  dblTotalNonBillableHours: number;
  strTotalBillableHours: string;
  strTotalNonBillableHours: string;
}

export interface BoardwiseSummaryResponse {
  strBoardGUID: string;
  strBoardName: string;
  dtFromDate: string;
  dtToDate: string;
  tasks: BoardwiseTaskSummary[];
  total: BoardwiseTotalSummary;
}

export type BoardwiseSummaryApiResponse = ApiResponse<BoardwiseSummaryResponse>;

// Boardwise Details Report
export interface BoardwiseDetailsParams {
  strBoardGUID?: string;
  dtFromDate?: string;
  dtToDate?: string;
  strUserGUIDs?: string;
}

export interface BoardwiseDetailRecord {
  strUserGUID: string;
  strUserName: string;
  strTaskGUID: string;
  intTaskNo: number;
  strTaskName: string;
  dblBillableHours: number;
  dblNonBillableHours: number;
  strBillableHours: string;
  strNonBillableHours: string;
  strBoardSectionName: string;
  strBoardSubModuleName: string;
  strTicketKey: string;
  strTicketUrl: string;
  strTicketSource: string;
}

export interface BoardwiseUserTotal {
  strUserGUID: string;
  strUserName: string;
  dblTotalBillableHours: number;
  dblTotalNonBillableHours: number;
  strTotalBillableHours: string;
  strTotalNonBillableHours: string;
}

export interface BoardwiseDetailsResponse {
  strBoardGUID: string;
  strBoardName: string;
  dtFromDate: string;
  dtToDate: string;
  items: BoardwiseDetailRecord[];
  userTotals: BoardwiseUserTotal[];
}

export type BoardwiseDetailsApiResponse = ApiResponse<BoardwiseDetailsResponse>;

// Ticket Wise Report
export interface TicketWiseReportParams {
  strBoardGUID?: string;
  strUserGUIDs?: string;
  dtFromDate?: string;
  dtToDate?: string;
}

export interface TicketWiseReportItem {
  intTaskNo: number;
  strTaskName: string;
  strUserGUID: string;
  strAssignTo: string;
  strStatus: string;
  bolIsBillable: boolean;
  decTotalHours: number;
  strTotalHours: string;
  strRateCurrencyCode: string;
  decCostInRateCurrency: number;
  strBaseCurrencyCode: string;
  decCostInBaseCurrency: number;
  decExchangeRate: number;
  strTicketKey: string;
  strTicketUrl: string;
  strTicketSource: string;
}

export interface TicketWiseReportResponse {
  strBoardGUID: string;
  strBoardName: string;
  dtFromDate: string;
  dtToDate: string;
  items: TicketWiseReportItem[];
}

export type TicketWiseReportApiResponse = ApiResponse<TicketWiseReportResponse>;
