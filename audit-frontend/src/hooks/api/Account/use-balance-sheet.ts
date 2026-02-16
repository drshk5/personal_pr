import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type { BalanceSheetFilter } from "@/types/Account/balance-sheet";
import { balanceSheetService } from "@/services/Account/balance-sheet.service";
import { downloadBlob } from "@/lib/utils";

export const balanceSheetQueryKeys = createQueryKeys("balance-sheet");

export const useBalanceSheet = (
  filter?: BalanceSheetFilter,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: balanceSheetQueryKeys.list(filter || {}),
    queryFn: () => balanceSheetService.getBalanceSheet(filter!),
    enabled: enabled && !!filter?.dtFromDate && !!filter?.dtToDate,
  });
};

export const useBalanceSheetPost = () => {
  return useMutation({
    mutationFn: (filter: BalanceSheetFilter) =>
      balanceSheetService.getBalanceSheetPost(filter),
    onSuccess: () => {
      toast.success("Balance sheet generated");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to generate balance sheet"),
  });
};

export const useBalanceSheetWithAccounts = (
  filter?: BalanceSheetFilter,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: balanceSheetQueryKeys.list({
      ...filter,
      _variant: "with-accounts",
    }),
    queryFn: () => balanceSheetService.getBalanceSheetWithAccounts(filter!),
    enabled: enabled && !!filter?.dtFromDate && !!filter?.dtToDate,
  });
};

export const useExportBalanceSheetPdf = () => {
  return useMutation({
    mutationFn: (filter: BalanceSheetFilter) =>
      balanceSheetService.exportBalanceSheetPdf(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `balance-sheet-${Date.now()}.pdf`);
      toast.success("Balance sheet PDF downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export balance sheet PDF"),
  });
};

export const usePreviewBalanceSheetPdf = () => {
  return useMutation({
    mutationFn: (filter: BalanceSheetFilter) =>
      balanceSheetService.exportBalanceSheetPdf(filter),
    onError: (error) =>
      handleMutationError(error, "Failed to preview balance sheet PDF"),
  });
};

export const useExportBalanceSheetExcel = () => {
  return useMutation({
    mutationFn: (filter: BalanceSheetFilter) =>
      balanceSheetService.exportBalanceSheetExcel(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `balance-sheet-${Date.now()}.xlsx`);
      toast.success("Balance sheet Excel downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export balance sheet Excel"),
  });
};

export const useExportBalanceSheetCsv = () => {
  return useMutation({
    mutationFn: (filter: BalanceSheetFilter) =>
      balanceSheetService.exportBalanceSheetCsv(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `balance-sheet-${Date.now()}.csv`);
      toast.success("Balance sheet CSV downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export balance sheet CSV"),
  });
};
