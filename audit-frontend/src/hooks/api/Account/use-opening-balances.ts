import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { openingBalanceService } from "@/services/Account/opening-balance.service";
import type {
  OpeningBalanceParams,
  OpeningBalanceCreate,
  OpeningBalanceUpdate,
  OpeningBalanceColumnMapping,
} from "@/types/Account/opening-balance";
import { toast } from "sonner";
import { handleMutationError } from "../common";

const OPENING_BALANCES_KEY = "opening-balances";

export const useOpeningBalances = (params: OpeningBalanceParams = {}) => {
  return useQuery({
    queryKey: [OPENING_BALANCES_KEY, params],
    queryFn: () => openingBalanceService.getOpeningBalances(params),
  });
};

export const useOpeningBalance = (openingBalanceGuid: string) => {
  return useQuery({
    queryKey: [OPENING_BALANCES_KEY, openingBalanceGuid],
    queryFn: () => openingBalanceService.getOpeningBalance(openingBalanceGuid),
    enabled: !!openingBalanceGuid,
  });
};

export const useCreateOpeningBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (openingBalance: OpeningBalanceCreate) => {
      return openingBalanceService.createOpeningBalance(openingBalance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPENING_BALANCES_KEY] });
      toast.success("Opening balance created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create opening balance"),
  });
};

export const useUpdateOpeningBalance = (openingBalanceGuid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (openingBalance: OpeningBalanceUpdate) => {
      if (!openingBalanceGuid) {
        throw new Error("Opening balance GUID is required");
      }
      return openingBalanceService.updateOpeningBalance(
        openingBalanceGuid,
        openingBalance
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPENING_BALANCES_KEY] });
      if (openingBalanceGuid) {
        queryClient.invalidateQueries({
          queryKey: [OPENING_BALANCES_KEY, openingBalanceGuid],
        });
      }
      toast.success("Opening balance updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update opening balance"),
  });
};

export const useDeleteOpeningBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (openingBalanceGuid: string) => {
      return openingBalanceService.deleteOpeningBalance(openingBalanceGuid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPENING_BALANCES_KEY] });
      toast.success("Opening balance deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete opening balance"),
  });
};

export const useValidateOpeningBalanceImport = () => {
  return useMutation({
    mutationFn: ({
      file,
      columnMapping,
    }: {
      file: File;
      columnMapping?: OpeningBalanceColumnMapping;
    }) => {
      return openingBalanceService.validateImport(file, columnMapping);
    },
    onError: (error) =>
      handleMutationError(error, "Failed to validate import file"),
  });
};

export const useImportOpeningBalances = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      columnMapping,
    }: {
      file: File;
      columnMapping?: OpeningBalanceColumnMapping;
    }) => {
      return openingBalanceService.importOpeningBalances(file, columnMapping);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [OPENING_BALANCES_KEY] });
      toast.success(data.summary);
    },
    onError: (error) =>
      handleMutationError(error, "Failed to import opening balances"),
  });
};
