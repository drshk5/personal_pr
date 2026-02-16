import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import type {
  AccountWithScheduleTreeResponse,
  AccountsByTypesTreeParams,
  AccountWithScheduleTree,
} from "@/types/Account/account";

const ACCOUNT_API_URL = ACCOUNT_API_PREFIX + "/Account";

export const accountService = {
  getAccountsByTypesTree: async (
    params: AccountsByTypesTreeParams
  ): Promise<AccountWithScheduleTreeResponse> => {
    const queryParams: Record<string, string | number> = {};

    // Optional: Account type GUIDs to EXCLUDE
    if (params.strAccountTypeGUIDs) {
      queryParams.strAccountTypeGUIDs = params.strAccountTypeGUIDs;
    }

    // Optional: Maximum level depth
    if (params.maxLevel !== undefined && params.maxLevel !== null) {
      queryParams.maxLevel = params.maxLevel;
    }

    return await ApiService.get<AccountWithScheduleTreeResponse>(
      `${ACCOUNT_API_URL}/by-account-types/tree`,
      queryParams
    );
  },

  getAccountsByTypes: async (
    accountTypeGuids: string[]
  ): Promise<AccountWithScheduleTree[]> => {
    return await ApiService.get<AccountWithScheduleTree[]>(
      `${ACCOUNT_API_URL}/by-account-types`,
      {
        strAccountTypeGUIDs: accountTypeGuids.join(","),
      }
    );
  },
};
