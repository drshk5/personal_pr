import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type {
  ProfitAndLossFilter,
  ProfitAndLossPeriodFilter,
} from "@/types/Account/profit-and-loss";
import { profitAndLossService } from "@/services/Account/profit-and-loss.service";
import { downloadBlob } from "@/lib/utils";

export const profitAndLossQueryKeys = createQueryKeys("profit-and-loss");

// Query Hooks
export const useProfitAndLoss = (
  filter?: ProfitAndLossFilter,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: profitAndLossQueryKeys.list(filter || {}),
    queryFn: () => profitAndLossService.getProfitAndLoss(filter!),
    enabled: enabled && !!filter?.dtFromDate && !!filter?.dtToDate,
  });
};

export const useProfitAndLossByPeriod = (
  filter?: ProfitAndLossPeriodFilter,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: profitAndLossQueryKeys.list({
      ...filter,
      _variant: "by-period",
    }),
    queryFn: () => profitAndLossService.getProfitAndLossByPeriod(filter!),
    enabled: enabled && !!filter?.year,
  });
};

// Mutation Hooks
export const useProfitAndLossPost = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossFilter) =>
      profitAndLossService.getProfitAndLossPost(filter),
    onSuccess: () => {
      toast.success("Profit & Loss report generated");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to generate Profit & Loss report"),
  });
};

export const useProfitAndLossByPeriodPost = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossPeriodFilter) =>
      profitAndLossService.getProfitAndLossByPeriodPost(filter),
    onSuccess: () => {
      toast.success("Profit & Loss report generated");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to generate Profit & Loss report"),
  });
};

// Export Hooks
export const useExportProfitAndLossPdf = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossFilter) =>
      profitAndLossService.exportProfitAndLossPdf(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `profit-and-loss-${Date.now()}.pdf`);
      toast.success("Profit & Loss PDF downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export Profit & Loss PDF"),
  });
};

export const usePreviewProfitAndLossPdf = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossFilter) =>
      profitAndLossService.exportProfitAndLossPdf(filter),
    onError: (error) =>
      handleMutationError(error, "Failed to preview Profit & Loss PDF"),
  });
};

export const useExportProfitAndLossExcel = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossFilter) =>
      profitAndLossService.exportProfitAndLossExcel(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `profit-and-loss-${Date.now()}.xlsx`);
      toast.success("Profit & Loss Excel downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export Profit & Loss Excel"),
  });
};

export const useExportProfitAndLossCsv = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossFilter) =>
      profitAndLossService.exportProfitAndLossCsv(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `profit-and-loss-${Date.now()}.csv`);
      toast.success("Profit & Loss CSV downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export Profit & Loss CSV"),
  });
};

// Export Hooks - By Period
export const useExportProfitAndLossPdfByPeriod = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossPeriodFilter) =>
      profitAndLossService.exportProfitAndLossPdfByPeriod(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `profit-and-loss-${Date.now()}.pdf`);
      toast.success("Profit & Loss PDF downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export Profit & Loss PDF"),
  });
};

export const usePreviewProfitAndLossPdfByPeriod = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossPeriodFilter) =>
      profitAndLossService.exportProfitAndLossPdfByPeriod(filter),
    onError: (error) =>
      handleMutationError(error, "Failed to preview Profit & Loss PDF"),
  });
};

export const useExportProfitAndLossExcelByPeriod = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossPeriodFilter) =>
      profitAndLossService.exportProfitAndLossExcelByPeriod(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `profit-and-loss-${Date.now()}.xlsx`);
      toast.success("Profit & Loss Excel downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export Profit & Loss Excel"),
  });
};

export const useExportProfitAndLossCsvByPeriod = () => {
  return useMutation({
    mutationFn: (filter: ProfitAndLossPeriodFilter) =>
      profitAndLossService.exportProfitAndLossCsvByPeriod(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `profit-and-loss-${Date.now()}.csv`);
      toast.success("Profit & Loss CSV downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export Profit & Loss CSV"),
  });
};
