import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import type {
  ProfitAndLossFilter,
  ProfitAndLossPeriodFilter,
  ProfitAndLossResponse,
} from "@/types/Account/profit-and-loss";

export const profitAndLossService = {
  getProfitAndLoss: async (
    params: ProfitAndLossFilter
  ): Promise<ProfitAndLossResponse> => {
    return await ApiService.get<ProfitAndLossResponse>(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss`,
      { ...params }
    );
  },

  getProfitAndLossPost: async (
    filter: ProfitAndLossFilter
  ): Promise<ProfitAndLossResponse> => {
    return await ApiService.post<ProfitAndLossResponse>(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss`,
      filter
    );
  },

  getProfitAndLossByPeriod: async (
    params: ProfitAndLossPeriodFilter
  ): Promise<ProfitAndLossResponse> => {
    return await ApiService.get<ProfitAndLossResponse>(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss/period`,
      { ...params }
    );
  },

  getProfitAndLossByPeriodPost: async (
    filter: ProfitAndLossPeriodFilter
  ): Promise<ProfitAndLossResponse> => {
    return await ApiService.post<ProfitAndLossResponse>(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss/period`,
      filter
    );
  },

  exportProfitAndLossPdf: async (
    filter: ProfitAndLossFilter
  ): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss/export/pdf`,
      { ...filter }
    );
  },

  exportProfitAndLossCsv: async (
    filter: ProfitAndLossFilter
  ): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss/export/csv/excel`,
      { format: "csv", ...filter }
    );
  },

  exportProfitAndLossExcel: async (
    filter: ProfitAndLossFilter
  ): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss/export/csv/excel`,
      { format: "excel", ...filter }
    );
  },

  exportProfitAndLossPdfByPeriod: async (
    filter: ProfitAndLossPeriodFilter
  ): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss/period/export/pdf`,
      { ...filter }
    );
  },

  exportProfitAndLossCsvByPeriod: async (
    filter: ProfitAndLossPeriodFilter
  ): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss/period/export/csv/excel`,
      { format: "csv", ...filter }
    );
  },

  exportProfitAndLossExcelByPeriod: async (
    filter: ProfitAndLossPeriodFilter
  ): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/ProfitAndLoss/period/export/csv/excel`,
      { format: "excel", ...filter }
    );
  },
};
