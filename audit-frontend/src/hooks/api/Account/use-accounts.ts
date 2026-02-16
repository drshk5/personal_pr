import { useQuery } from "@tanstack/react-query";
import { accountService } from "@/services/Account/account.service";
import type { AccountsByTypesTreeParams } from "@/types/Account/account";

const ACCOUNTS_BY_TYPES_TREE_KEY = "accounts-by-types-tree";
const ACCOUNTS_BY_TYPES_KEY = "accounts-by-types";

export const useAccountsByTypesTree = (
  params: AccountsByTypesTreeParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [ACCOUNTS_BY_TYPES_TREE_KEY, params],
    queryFn: () => accountService.getAccountsByTypesTree(params),
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
};

export const useAccountsByTypes = (
  accountTypeGuids: string[],
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [ACCOUNTS_BY_TYPES_KEY, accountTypeGuids],
    queryFn: () => accountService.getAccountsByTypes(accountTypeGuids),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : accountTypeGuids.length > 0,
  });
};
