import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type { TrialBalanceFilter } from "@/types/Account/trial-balance";
import { trialBalanceService } from "@/services/Account/trial-balance.service";
import { downloadBlob } from "@/lib/utils";

export const trialBalanceQueryKeys = createQueryKeys("trial-balance");

export const useTrialBalance = (
  filter?: TrialBalanceFilter,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: trialBalanceQueryKeys.list(filter || {}),
    queryFn: () => trialBalanceService.getTrialBalance(filter!),
    enabled: enabled && !!filter?.dtFromDate && !!filter?.dtToDate,
  });
};

export const useTrialBalancePost = () => {
  return useMutation({
    mutationFn: (filter: TrialBalanceFilter) =>
      trialBalanceService.getTrialBalancePost(filter),
    onSuccess: () => {
      toast.success("Trial balance generated");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to generate trial balance"),
  });
};

export const useExportTrialBalancePdf = () => {
  return useMutation({
    mutationFn: (filter: TrialBalanceFilter) =>
      trialBalanceService.exportTrialBalancePdf(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `trial-balance-${Date.now()}.pdf`);
      toast.success("Trial balance PDF downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export trial balance PDF"),
  });
};

export const usePreviewTrialBalancePdf = () => {
  return useMutation({
    mutationFn: (filter: TrialBalanceFilter) =>
      trialBalanceService.exportTrialBalancePdf(filter),
    onError: (error) =>
      handleMutationError(error, "Failed to preview trial balance PDF"),
  });
};

export const useExportTrialBalanceCsv = () => {
  return useMutation({
    mutationFn: (filter: TrialBalanceFilter) =>
      trialBalanceService.exportTrialBalanceCsv(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `trial-balance-${Date.now()}.csv`);
      toast.success("Trial balance CSV downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export trial balance CSV"),
  });
};

export const useExportTrialBalanceExcel = () => {
  return useMutation({
    mutationFn: (filter: TrialBalanceFilter) =>
      trialBalanceService.exportTrialBalanceExcel(filter),
    onSuccess: (blob) => {
      downloadBlob(blob, `trial-balance-${Date.now()}.xlsx`);
      toast.success("Trial balance Excel downloaded");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export trial balance Excel"),
  });
};
