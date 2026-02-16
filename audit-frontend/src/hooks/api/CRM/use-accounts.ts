import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import { accountService } from "@/services/CRM/account.service";
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountFilterParams,
  AccountBulkArchiveDto,
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
