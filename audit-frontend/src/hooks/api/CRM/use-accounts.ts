import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { accountService } from "@/services/CRM/account.service";
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountFilterParams,
  AccountBulkArchiveDto,
  AccountDuplicateHandling,
} from "@/types/CRM/account";

export const accountQueryKeys = createQueryKeys("crm-accounts");

// ── Core CRUD ──────────────────────────────────────────────────

export const useAccounts = (params?: AccountFilterParams) => {
  return useQuery({
    queryKey: accountQueryKeys.list(params || {}),
    queryFn: () => accountService.getAccounts(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

export const useAccount = (id?: string) => {
  return useQuery({
    queryKey: accountQueryKeys.detail(id || ""),
    queryFn: () => accountService.getAccount(id!),
    enabled: !!id,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAccountDto) => accountService.createAccount(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      toast.success("Account created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create account"),
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountDto }) =>
      accountService.updateAccount(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      toast.success("Account updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update account"),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => accountService.deleteAccount(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      toast.success("Account deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete account"),
  });
};

// ── Bulk Operations ────────────────────────────────────────────

export const useBulkArchiveAccounts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AccountBulkArchiveDto) =>
      accountService.bulkArchive(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      toast.success("Accounts archived successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to archive accounts"),
  });
};

export const useBulkRestoreAccounts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AccountBulkArchiveDto) =>
      accountService.bulkRestore(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      toast.success("Accounts restored successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to restore accounts"),
  });
};

// ── Import / Export ────────────────────────────────────────────

export const useImportAccounts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      columnMapping,
      duplicateHandling,
    }: {
      file: File;
      columnMapping: Record<string, string>;
      duplicateHandling?: AccountDuplicateHandling;
    }) =>
      accountService.importAccounts(file, columnMapping, duplicateHandling),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      toast.success(
        `Import complete: ${result.intSuccessRows} success, ${result.intErrorRows} errors`
      );
    },
    onError: (error) => handleMutationError(error, "Failed to import accounts"),
  });
};

export const useExportAccounts = () => {
  return useMutation({
    mutationFn: ({ params }: { params?: AccountFilterParams }) =>
      accountService.exportAccounts(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "accounts-export.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Accounts exported successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to export accounts"),
  });
};
