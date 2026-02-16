import { useMutation, useQuery } from "@tanstack/react-query";
import { accountTypeService } from "@/services/central/account-type.service";
import type {
  AccountTypeCreate,
  AccountTypeUpdate,
  AccountTypeExportParams,
} from "@/types/central/account-type";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "../common";
import type { BaseListParams } from "@/types";

const STALE_TIME = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export const accountTypeQueryKeys = createQueryKeys("accountTypes");
export const activeAccountTypesKey = "accountTypes";

export const useAccountTypes = (params?: BaseListParams) => {
  return useQuery({
    queryKey: accountTypeQueryKeys.list(params || {}),
    queryFn: () => accountTypeService.getAccountTypes(params),
  });
};

export const useAccountType = (id?: string) => {
  return useQuery({
    queryKey: accountTypeQueryKeys.detail(id || ""),
    queryFn: () => accountTypeService.getAccountType(id!),
    enabled: !!id,
  });
};

export const useCreateAccountType = () => {
  return useMutation({
    mutationFn: (accountType: AccountTypeCreate) =>
      accountTypeService.createAccountType(accountType),
    onSuccess: () => {
      toast.success("Account type created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create account type"),
  });
};

export const useUpdateAccountType = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountTypeUpdate }) =>
      accountTypeService.updateAccountType(id, data),
    onSuccess: () => {
      toast.success("Account type updated successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to update account type"),
  });
};

export const useDeleteAccountType = () => {
  return useMutation({
    mutationFn: (id: string) => accountTypeService.deleteAccountType(id),
    onSuccess: () => {
      toast.success("Account type deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete account type"),
  });
};

export const useActiveAccountTypes = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: search
      ? [activeAccountTypesKey, "active", search]
      : [activeAccountTypesKey, "active"],
    queryFn: () => accountTypeService.getActiveAccountTypes(search),
    enabled,
    staleTime: STALE_TIME,
  });
};

export const useOnlyBankAccountTypes = (
  search?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: search
      ? [activeAccountTypesKey, "onlyBank", search]
      : [activeAccountTypesKey, "onlyBank"],
    queryFn: () => accountTypeService.getOnlyBankAccountTypes(search),
    enabled,
    staleTime: STALE_TIME,
  });
};

export const useExportAccountTypes = () => {
  return useMutation({
    mutationFn: (params: AccountTypeExportParams) =>
      accountTypeService.exportAccountTypes(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      const extension = variables.format === "excel" ? "xlsx" : "csv";
      link.download = `account_types_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Account types exported successfully as ${variables.format.toUpperCase()}`
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export account types"),
  });
};
