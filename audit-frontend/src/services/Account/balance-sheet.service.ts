import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import type {
  BalanceSheetFilter,
  BalanceSheetResponse,
} from "@/types/Account/balance-sheet";

export const balanceSheetService = {
  getBalanceSheet: async (
    params: BalanceSheetFilter
  ): Promise<BalanceSheetResponse> => {
    return await ApiService.get<BalanceSheetResponse>(
      `${ACCOUNT_API_PREFIX}/BalanceSheet`,
      { ...params }
    );
  },

  getBalanceSheetPost: async (
    filter: BalanceSheetFilter
  ): Promise<BalanceSheetResponse> => {
    return await ApiService.post<BalanceSheetResponse>(
      `${ACCOUNT_API_PREFIX}/BalanceSheet`,
      filter
    );
  },

  getBalanceSheetWithAccounts: async (
    params: BalanceSheetFilter
  ): Promise<BalanceSheetResponse> => {
    return await ApiService.get<BalanceSheetResponse>(
      `${ACCOUNT_API_PREFIX}/BalanceSheet/with-accounts`,
      { ...params }
    );
  },

  exportBalanceSheetPdf: async (filter: BalanceSheetFilter): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/BalanceSheet/export/pdf`,
      { ...filter }
    );
  },

  exportBalanceSheetCsv: async (filter: BalanceSheetFilter): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/BalanceSheet/export/csv/excel`,
      { format: "csv", ...filter }
    );
  },

  exportBalanceSheetExcel: async (
    filter: BalanceSheetFilter
  ): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/BalanceSheet/export/csv/excel`,
      { format: "excel", ...filter }
    );
  },
};
