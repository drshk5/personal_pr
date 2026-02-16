import { ApiService } from "@/lib/api/api-service";
import { ACCOUNT_API_PREFIX } from "@/constants/api-prefix";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import type {
  OpeningBalance,
  OpeningBalanceCreate,
  OpeningBalanceListResponse,
  OpeningBalanceParams,
  OpeningBalanceUpdate,
  OpeningBalanceColumnMapping,
  OpeningBalanceImportResult,
} from "@/types/Account/opening-balance";

const OPENING_BALANCE_API_PREFIX = ACCOUNT_API_PREFIX + "/OpeningBalance";

export const openingBalanceService = {
  getOpeningBalances: async (
    params: OpeningBalanceParams = {}
  ): Promise<OpeningBalanceListResponse> => {
    return await ApiService.getWithMeta<OpeningBalanceListResponse>(
      `${OPENING_BALANCE_API_PREFIX}`,
      formatPaginationParams({
        ...params,
      })
    );
  },

  getOpeningBalance: async (id: string): Promise<OpeningBalance> => {
    return await ApiService.get<OpeningBalance>(
      `${OPENING_BALANCE_API_PREFIX}/${id}`
    );
  },

  createOpeningBalance: async (
    openingBalance: OpeningBalanceCreate
  ): Promise<OpeningBalance> => {
    return await ApiService.post<OpeningBalance>(
      `${OPENING_BALANCE_API_PREFIX}`,
      openingBalance
    );
  },

  updateOpeningBalance: async (
    id: string,
    openingBalance: OpeningBalanceUpdate
  ): Promise<OpeningBalance> => {
    return await ApiService.put<OpeningBalance>(
      `${OPENING_BALANCE_API_PREFIX}/${id}`,
      openingBalance
    );
  },

  deleteOpeningBalance: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${OPENING_BALANCE_API_PREFIX}/${id}`);
    return true;
  },

  validateImport: async (
    file: File,
    columnMapping?: OpeningBalanceColumnMapping
  ): Promise<OpeningBalanceImportResult> => {
    const formData = new FormData();
    formData.append("file", file);

    if (columnMapping) {
      formData.append("columnMapping", JSON.stringify(columnMapping));
    }

    return await ApiService.post<OpeningBalanceImportResult>(
      `${OPENING_BALANCE_API_PREFIX}/import/validate`,
      formData
    );
  },

  importOpeningBalances: async (
    file: File,
    columnMapping?: OpeningBalanceColumnMapping
  ): Promise<OpeningBalanceImportResult> => {
    const formData = new FormData();
    formData.append("file", file);

    if (columnMapping) {
      formData.append("columnMapping", JSON.stringify(columnMapping));
    }

    return await ApiService.post<OpeningBalanceImportResult>(
      `${OPENING_BALANCE_API_PREFIX}/import`,
      formData
    );
  },
};
