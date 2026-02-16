import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type {
  BoardwiseDetailsApiResponse,
  BoardwiseDetailsParams,
  BoardwiseSummaryApiResponse,
  BoardwiseSummaryParams,
  TicketWiseReportApiResponse,
  TicketWiseReportParams,
  UserDailyWorkSummaryResponse,
  UserBoardBillableDetailResponse,
  UserBoardBillableSummaryResponse,
  UserPerformanceReport,
  UserBoardBillableDetailParams,
  UserBoardBillableSummaryParams,
  UserDailyWorkSummaryParams,
  UserPerformanceReportParams,
} from "@/types/task/task-reports";

export const taskReportsService = {
  getUserDailyWorkSummary: async (
    params: UserDailyWorkSummaryParams = {}
  ): Promise<UserDailyWorkSummaryResponse> => {
    return await ApiService.getWithMeta<UserDailyWorkSummaryResponse>(
      `${TASK_API_PREFIX}/Reports/user-daily-work-summary`,
      params as Record<string, unknown>
    );
  },

  exportUserDailyWorkSummaryToPdf: async (
    params: UserDailyWorkSummaryParams = {}
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/user-daily-work-summary/export/pdf`,
      params as Record<string, unknown>
    );
  },

  exportUserDailyWorkSummaryToExcel: async (
    params: UserDailyWorkSummaryParams = {}
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/user-daily-work-summary/export/excel`,
      params as Record<string, unknown>
    );
  },

  getUserBoardBillableSummary: async (
    params: UserBoardBillableSummaryParams
  ): Promise<UserBoardBillableSummaryResponse> => {
    return await ApiService.getWithMeta<UserBoardBillableSummaryResponse>(
      `${TASK_API_PREFIX}/Reports/user-board-billable-summary`,
      params as unknown as Record<string, unknown>
    );
  },

  exportUserBoardBillableSummaryToPdf: async (
    params: UserBoardBillableSummaryParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/user-board-billable-summary/export/pdf`,
      params as unknown as Record<string, unknown>
    );
  },

  exportUserBoardBillableSummaryToExcel: async (
    params: UserBoardBillableSummaryParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/user-board-billable-summary/export/excel`,
      params as unknown as Record<string, unknown>
    );
  },

  getUserBoardBillableDetail: async (
    params: UserBoardBillableDetailParams
  ): Promise<UserBoardBillableDetailResponse> => {
    return await ApiService.getWithMeta<UserBoardBillableDetailResponse>(
      `${TASK_API_PREFIX}/Reports/user-board-billable-detail`,
      params as unknown as Record<string, unknown>
    );
  },

  exportUserBoardBillableDetailToPdf: async (
    params: UserBoardBillableDetailParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/user-board-billable-detail/export/pdf`,
      params as unknown as Record<string, unknown>
    );
  },

  exportUserBoardBillableDetailToExcel: async (
    params: UserBoardBillableDetailParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/user-board-billable-detail/export/excel`,
      params as unknown as Record<string, unknown>
    );
  },

  getUserPerformanceReport: async (
    params: UserPerformanceReportParams = {}
  ): Promise<UserPerformanceReport> => {
    return await ApiService.getWithMeta<UserPerformanceReport>(
      `${TASK_API_PREFIX}/Reports/user-performance`,
      params as Record<string, unknown>
    );
  },

  exportUserPerformanceReportToPdf: async (
    params: UserPerformanceReportParams = {}
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/user-performance/export/pdf`,
      params as Record<string, unknown>
    );
  },

  exportUserPerformanceReportToExcel: async (
    params: UserPerformanceReportParams = {}
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/user-performance/export/excel`,
      params as Record<string, unknown>
    );
  },

  exportUserPerformanceReportToCsv: async (
    params: UserPerformanceReportParams = {}
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/user-performance/export/csv`,
      params as Record<string, unknown>
    );
  },

  getBoardwiseSummary: async (
    params: BoardwiseSummaryParams
  ): Promise<BoardwiseSummaryApiResponse> => {
    return await ApiService.getWithMeta<BoardwiseSummaryApiResponse>(
      `${TASK_API_PREFIX}/Reports/boardwise-summary`,
      params as Record<string, unknown>
    );
  },

  exportBoardwiseSummaryToPdf: async (
    params: BoardwiseSummaryParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/boardwise-summary/export/pdf`,
      params as Record<string, unknown>
    );
  },

  exportBoardwiseSummaryToExcel: async (
    params: BoardwiseSummaryParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/boardwise-summary/export/excel`,
      params as Record<string, unknown>
    );
  },

  getBoardwiseDetails: async (
    params: BoardwiseDetailsParams
  ): Promise<BoardwiseDetailsApiResponse> => {
    return await ApiService.getWithMeta<BoardwiseDetailsApiResponse>(
      `${TASK_API_PREFIX}/Reports/boardwise-details`,
      params as Record<string, unknown>
    );
  },

  exportBoardwiseDetailsToPdf: async (
    params: BoardwiseDetailsParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/boardwise-details/export/pdf`,
      params as Record<string, unknown>
    );
  },

  exportBoardwiseDetailsToExcel: async (
    params: BoardwiseDetailsParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/boardwise-details/export/excel`,
      params as Record<string, unknown>
    );
  },

  getTicketWiseReport: async (
    params: TicketWiseReportParams
  ): Promise<TicketWiseReportApiResponse> => {
    return await ApiService.getWithMeta<TicketWiseReportApiResponse>(
      `${TASK_API_PREFIX}/Reports/ticket-wise-report`,
      params as Record<string, unknown>
    );
  },

  exportTicketWiseReportToPdf: async (
    params: TicketWiseReportParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/ticket-wise-report/export/pdf`,
      params as Record<string, unknown>
    );
  },

  exportTicketWiseReportToExcel: async (
    params: TicketWiseReportParams
  ): Promise<Blob> => {
    return ApiService.getBlob(
      `${TASK_API_PREFIX}/Reports/ticket-wise-report/export/excel`,
      params as Record<string, unknown>
    );
  },
};
