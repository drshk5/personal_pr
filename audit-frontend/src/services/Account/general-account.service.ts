import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";

import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import type {
  GeneralAccount,
  GeneralAccountCreate,
  GeneralAccountListResponse,
  GeneralAccountParams,
  GeneralAccountUpdate,
} from "@/types/Account/general-account";

const GENERNAL_ACCOUNT_API_PREFIX = ACCOUNT_API_PREFIX + "/GeneralAccount";

export const generalAccountService = {
  getGeneralAccounts: async (
    params: GeneralAccountParams = {}
  ): Promise<GeneralAccountListResponse> => {
    return await ApiService.getWithMeta<GeneralAccountListResponse>(
      `${GENERNAL_ACCOUNT_API_PREFIX}`,
      formatPaginationParams({
        ...params,
      })
    );
  },

  getGeneralAccount: async (id: string): Promise<GeneralAccount> => {
    return await ApiService.get<GeneralAccount>(
      `${GENERNAL_ACCOUNT_API_PREFIX}/${id}`
    );
  },

  createGeneralAccount: async (
    generalAccount: GeneralAccountCreate
  ): Promise<GeneralAccount> => {
    return await ApiService.post<GeneralAccount>(
      `${GENERNAL_ACCOUNT_API_PREFIX}`,
      generalAccount
    );
  },

  updateGeneralAccount: async (
    id: string,
    generalAccount: GeneralAccountUpdate
  ): Promise<GeneralAccount> => {
    return await ApiService.put<GeneralAccount>(
      `${GENERNAL_ACCOUNT_API_PREFIX}/${id}`,
      generalAccount
    );
  },

  deleteGeneralAccount: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${GENERNAL_ACCOUNT_API_PREFIX}/${id}`);
    return true;
  },
};
