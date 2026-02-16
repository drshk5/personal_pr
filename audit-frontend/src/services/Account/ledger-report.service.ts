import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import type {
  LedgerReportFilter,
  LedgerReportResponse,
} from "@/types/Account/ledger-report";

export const ledgerReportService = {
  getLedgerReport: async (
    params: LedgerReportFilter
  ): Promise<LedgerReportResponse> => {
    return await ApiService.get<LedgerReportResponse>(
      `${ACCOUNT_API_PREFIX}/LedgerReport`,
      { ...params }
    );
  },

  getLedgerReportPost: async (
    filter: LedgerReportFilter
  ): Promise<LedgerReportResponse> => {
    return await ApiService.post<LedgerReportResponse>(
      `${ACCOUNT_API_PREFIX}/LedgerReport`,
      filter
    );
  },

  exportLedgerReportPdf: async (filter: LedgerReportFilter): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/LedgerReport/export/pdf`,
      { ...filter }
    );
  },

  exportLedgerReportExcel: async (
    filter: LedgerReportFilter
  ): Promise<Blob> => {
    return await ApiService.downloadFile(
      `${ACCOUNT_API_PREFIX}/LedgerReport/export/excel`,
      { ...filter }
    );
  },
};
