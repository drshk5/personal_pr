import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import type {
  TrialBalanceFilter,
  TrialBalanceResponse,
} from "@/types/Account/trial-balance";

export const trialBalanceService = {
  getTrialBalance: async (
    params: TrialBalanceFilter
  ): Promise<TrialBalanceResponse> => {
    return await ApiService.get<TrialBalanceResponse>(
      `${ACCOUNT_API_PREFIX}/TrialBalance`,
      { ...params }
    );
  },

  getTrialBalancePost: async (
    filter: TrialBalanceFilter
  ): Promise<TrialBalanceResponse> => {
    return await ApiService.post<TrialBalanceResponse>(
      `${ACCOUNT_API_PREFIX}/TrialBalance`,
      filter
    );
  },

  exportTrialBalancePdf: async (filter: TrialBalanceFilter): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/TrialBalance/export/pdf`,
      { ...filter }
    );
  },

  exportTrialBalanceCsv: async (filter: TrialBalanceFilter): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/TrialBalance/export/csv/excel`,
      { format: "csv", ...filter }
    );
  },

  exportTrialBalanceExcel: async (
    filter: TrialBalanceFilter
  ): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/TrialBalance/export/csv/excel`,
      { format: "excel", ...filter }
    );
  },
};
