import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type { LedgerReportFilter } from "@/types/Account/ledger-report";
import { ledgerReportService } from "@/services/Account/ledger-report.service";
import { downloadBlob } from "@/lib/utils";

export const ledgerReportQueryKeys = createQueryKeys("ledger-report");

export const useLedgerReport = (
  filter?: LedgerReportFilter,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ledgerReportQueryKeys.list(filter || {}),
    queryFn: () => ledgerReportService.getLedgerReport(filter!),
    enabled: enabled && !!filter?.dtFromDate && !!filter?.dtToDate,
  });
};

export const useLedgerReportPost = () => {
  return useMutation({
    mutationFn: (filter: LedgerReportFilter) =>
      ledgerReportService.getLedgerReportPost(filter),
    onSuccess: () => {
      toast.success("Ledger report generated");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to generate ledger report"),
  });
};

export const useExportLedgerReportPdf = () => {
  return useMutation({
    mutationFn: (filter: LedgerReportFilter) =>
      ledgerReportService.exportLedgerReportPdf(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `ledger-report-${Date.now()}.pdf`);
      toast.success("Ledger report PDF downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export ledger report PDF"),
  });
};

export const usePreviewLedgerReportPdf = () => {
  return useMutation({
    mutationFn: (filter: LedgerReportFilter) =>
      ledgerReportService.exportLedgerReportPdf(filter),
    onError: (error) =>
      handleMutationError(error, "Failed to preview ledger report PDF"),
  });
};

export const useExportLedgerReportExcel = () => {
  return useMutation({
    mutationFn: (filter: LedgerReportFilter) =>
      ledgerReportService.exportLedgerReportExcel(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `ledger-report-${Date.now()}.xlsx`);
      toast.success("Ledger report Excel downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export ledger report Excel"),
  });
};
