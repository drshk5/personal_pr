import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type { BaseListParams } from "@/types";
import type {
  AccountType,
  AccountTypeCreate,
  AccountTypeListResponse,
  AccountTypeSimple,
  AccountTypeUpdate,
  AccountTypeExportParams,
} from "@/types/central/account-type";

export const accountTypeService = {
  getAccountTypes: async (
    params: BaseListParams = {}
  ): Promise<AccountTypeListResponse> => {
    return await ApiService.getWithMeta<AccountTypeListResponse>(
      "/AccountType",
      formatPaginationParams({
        ...params,
      })
    );
  },

  getAccountType: async (id: string): Promise<AccountType> => {
    return await ApiService.get<AccountType>(`/AccountType/${id}`);
  },

  createAccountType: async (
    accountType: AccountTypeCreate
  ): Promise<AccountType> => {
    return await ApiService.post<AccountType>("/AccountType", accountType);
  },

  updateAccountType: async (
    id: string,
    accountType: AccountTypeUpdate
  ): Promise<AccountType> => {
    return await ApiService.put<AccountType>(`/AccountType/${id}`, accountType);
  },

  getActiveAccountTypes: async (
    search?: string
  ): Promise<AccountTypeSimple[]> => {
    return await ApiService.get<AccountTypeSimple[]>("/AccountType/active", {
      search: search || undefined,
    });
  },

  getOnlyBankAccountTypes: async (
    search?: string
  ): Promise<AccountTypeSimple[]> => {
    return await ApiService.get<AccountTypeSimple[]>("/AccountType/onlyBank", {
      search: search || undefined,
    });
  },

  deleteAccountType: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`/AccountType/${id}`);
    return true;
  },

  exportAccountTypes: async (
    params: AccountTypeExportParams
  ): Promise<Blob> => {
    return await ApiService.exportFile(
      "/AccountType/export",
      {},
      params.format
    );
  },
};
