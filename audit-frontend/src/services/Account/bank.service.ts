import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  Bank,
  BankCreate,
  BankListResponse,
  BankParams,
  BankSimple,
  BankUpdate,
} from "@/types/Account/bank";

export const bankService = {
  getBanks: async (params: BankParams = {}): Promise<BankListResponse> => {
    return await ApiService.getWithMeta<BankListResponse>(
      `${ACCOUNT_API_PREFIX}/Bank`,
      formatPaginationParams(params as Record<string, unknown>)
    );
  },

  getBank: async (id: string): Promise<Bank> => {
    return await ApiService.get<Bank>(`${ACCOUNT_API_PREFIX}/Bank/${id}`);
  },

  createBank: async (bank: BankCreate): Promise<BankSimple> => {
    return await ApiService.post<BankSimple>(
      `${ACCOUNT_API_PREFIX}/Bank`,
      bank
    );
  },

  updateBank: async (id: string, bank: BankUpdate): Promise<BankSimple> => {
    return await ApiService.put<BankSimple>(
      `${ACCOUNT_API_PREFIX}/Bank/${id}`,
      bank
    );
  },

  deleteBank: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${ACCOUNT_API_PREFIX}/Bank/${id}`);
    return true;
  },

  getActiveBanks: async (search?: string): Promise<BankSimple[]> => {
    try {
      const banks = await ApiService.get<
        { value: string; label: string; accountNumber: string }[]
      >(`${ACCOUNT_API_PREFIX}/Bank/active-banks`, {
        search,
      });
      return (banks || []).map((item) => ({
        strBankGUID: item.value,
        strAccountName: item.label,
        strAccountNumber: item.accountNumber,
      })) as BankSimple[];
    } catch {
      const response = await ApiService.getWithMeta<BankListResponse>(
        `${ACCOUNT_API_PREFIX}/Bank`,
        formatPaginationParams({
          search,
          pageSize: 1000,
          bolIsActive: true,
        })
      );
      return response.data || [];
    }
  },
};
