import { useQuery, useMutation } from "@tanstack/react-query";
import { createQueryKeys } from "@/hooks/api/common";
import type {
  BoardwiseDetailsParams,
  BoardwiseSummaryParams,
  TicketWiseReportParams,
  UserBoardBillableDetailParams,
  UserBoardBillableSummaryParams,
  UserDailyWorkSummaryParams,
  UserPerformanceReportParams,
} from "@/types/task/task-reports";
import { taskReportsService } from "@/services";

export const taskReportsQueryKeys = createQueryKeys("taskReports");

export const useUserDailyWorkSummary = (
  params?: UserDailyWorkSummaryParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: taskReportsQueryKeys.list({
      type: "user-daily-work-summary",
      ...params,
    }),
    queryFn: () => taskReportsService.getUserDailyWorkSummary(params || {}),
    enabled,
  });
};

export const useUserPerformanceReport = (
  params?: UserPerformanceReportParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: taskReportsQueryKeys.list({
      type: "user-performance",
      ...params,
    }),
    queryFn: () => taskReportsService.getUserPerformanceReport(params || {}),
    enabled,
  });
};

export const useUserBoardBillableSummary = (
  params: UserBoardBillableSummaryParams | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: taskReportsQueryKeys.list({
      type: "user-board-billable-summary",
      ...params,
    }),
    queryFn: () => taskReportsService.getUserBoardBillableSummary(params!),
    enabled: enabled && !!params?.strBoardGUID,
  });
};

export const useUserBoardBillableDetail = (
  params: UserBoardBillableDetailParams | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: taskReportsQueryKeys.list({
      type: "user-board-billable-detail",
      ...params,
    }),
    queryFn: () => taskReportsService.getUserBoardBillableDetail(params!),
    enabled: enabled && !!params?.strBoardGUID,
  });
};

export const useBoardwiseSummaryReport = (
  params: BoardwiseSummaryParams | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: taskReportsQueryKeys.list({
      type: "boardwise-summary",
      ...params,
    }),
    queryFn: () => taskReportsService.getBoardwiseSummary(params || {}),
    enabled:
      enabled &&
      !!params?.strBoardGUID &&
      !!params?.dtFromDate &&
      !!params?.dtToDate,
  });
};

export const useBoardwiseDetailsReport = (
  params: BoardwiseDetailsParams | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: taskReportsQueryKeys.list({
      type: "boardwise-details",
      ...params,
    }),
    queryFn: () => taskReportsService.getBoardwiseDetails(params || {}),
    enabled:
      enabled &&
      !!params?.strBoardGUID &&
      !!params?.dtFromDate &&
      !!params?.dtToDate,
  });
};

export const useTicketWiseReport = (
  params: TicketWiseReportParams | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: taskReportsQueryKeys.list({
      type: "ticket-wise-report",
      ...params,
    }),
    queryFn: () => {
      if (!params?.strBoardGUID) {
        throw new Error("Board GUID is required");
      }
      return taskReportsService.getTicketWiseReport(params);
    },
    enabled:
      enabled &&
      !!params?.strBoardGUID &&
      !!params?.dtFromDate &&
      !!params?.dtToDate,
  });
};

// Export Mutations
export const useExportUserDailyWorkSummaryPdf = () => {
  return useMutation({
    mutationFn: (params: UserDailyWorkSummaryParams) =>
      taskReportsService.exportUserDailyWorkSummaryToPdf(params || {}),
  });
};

export const useExportUserDailyWorkSummaryExcel = () => {
  return useMutation({
    mutationFn: (params: UserDailyWorkSummaryParams) =>
      taskReportsService.exportUserDailyWorkSummaryToExcel(params),
  });
};

export const useExportUserBoardBillableSummaryPdf = () => {
  return useMutation({
    mutationFn: (params: UserBoardBillableSummaryParams) =>
      taskReportsService.exportUserBoardBillableSummaryToPdf(params),
  });
};

export const useExportUserBoardBillableSummaryExcel = () => {
  return useMutation({
    mutationFn: (params: UserBoardBillableSummaryParams) =>
      taskReportsService.exportUserBoardBillableSummaryToExcel(params),
  });
};

export const useExportUserBoardBillableDetailPdf = () => {
  return useMutation({
    mutationFn: (params: UserBoardBillableDetailParams) =>
      taskReportsService.exportUserBoardBillableDetailToPdf(params),
  });
};

export const useExportUserBoardBillableDetailExcel = () => {
  return useMutation({
    mutationFn: (params: UserBoardBillableDetailParams) =>
      taskReportsService.exportUserBoardBillableDetailToExcel(params),
  });
};

export const useExportUserPerformanceReportPdf = () => {
  return useMutation({
    mutationFn: (params: UserPerformanceReportParams) =>
      taskReportsService.exportUserPerformanceReportToPdf(params || {}),
  });
};

export const useExportUserPerformanceReportExcel = () => {
  return useMutation({
    mutationFn: (params: UserPerformanceReportParams) =>
      taskReportsService.exportUserPerformanceReportToExcel(params || {}),
  });
};

export const useExportUserPerformanceReportCsv = () => {
  return useMutation({
    mutationFn: (params: UserPerformanceReportParams) =>
      taskReportsService.exportUserPerformanceReportToCsv(params || {}),
  });
};

export const useExportBoardwiseSummaryPdf = () => {
  return useMutation({
    mutationFn: (params: BoardwiseSummaryParams) =>
      taskReportsService.exportBoardwiseSummaryToPdf(params),
  });
};

export const useExportBoardwiseSummaryExcel = () => {
  return useMutation({
    mutationFn: (params: BoardwiseSummaryParams) =>
      taskReportsService.exportBoardwiseSummaryToExcel(params),
  });
};

export const useExportBoardwiseDetailsPdf = () => {
  return useMutation({
    mutationFn: (params: BoardwiseDetailsParams) =>
      taskReportsService.exportBoardwiseDetailsToPdf(params),
  });
};

export const useExportBoardwiseDetailsExcel = () => {
  return useMutation({
    mutationFn: (params: BoardwiseDetailsParams) =>
      taskReportsService.exportBoardwiseDetailsToExcel(params),
  });
};

export const useExportTicketWiseReportPdf = () => {
  return useMutation({
    mutationFn: (params: TicketWiseReportParams) =>
      taskReportsService.exportTicketWiseReportToPdf(params || {}),
  });
};

export const useExportTicketWiseReportExcel = () => {
  return useMutation({
    mutationFn: (params: TicketWiseReportParams) =>
      taskReportsService.exportTicketWiseReportToExcel(params || {}),
  });
};

// Preview Mutations
export const usePreviewUserDailyWorkSummaryPdf = () => {
  return useMutation({
    mutationFn: (params: UserDailyWorkSummaryParams) =>
      taskReportsService.exportUserDailyWorkSummaryToPdf(params || {}),
  });
};

export const usePreviewUserBoardBillableSummaryPdf = () => {
  return useMutation({
    mutationFn: (params: UserBoardBillableSummaryParams) =>
      taskReportsService.exportUserBoardBillableSummaryToPdf(params),
  });
};

export const usePreviewUserBoardBillableDetailPdf = () => {
  return useMutation({
    mutationFn: (params: UserBoardBillableDetailParams) =>
      taskReportsService.exportUserBoardBillableDetailToPdf(params),
  });
};

export const usePreviewUserPerformanceReportPdf = () => {
  return useMutation({
    mutationFn: (params: UserPerformanceReportParams) =>
      taskReportsService.exportUserPerformanceReportToPdf(params || {}),
  });
};

export const usePreviewBoardwiseSummaryPdf = () => {
  return useMutation({
    mutationFn: (params: BoardwiseSummaryParams) =>
      taskReportsService.exportBoardwiseSummaryToPdf(params),
  });
};

export const usePreviewBoardwiseDetailsPdf = () => {
  return useMutation({
    mutationFn: (params: BoardwiseDetailsParams) =>
      taskReportsService.exportBoardwiseDetailsToPdf(params),
  });
};

export const usePreviewTicketWiseReportPdf = () => {
  return useMutation({
    mutationFn: (params: TicketWiseReportParams) =>
      taskReportsService.exportTicketWiseReportToPdf(params),
  });
};
