import { ApiService } from "@/lib/api/api-service";
import { formatPaginationParams } from "@/lib/utils/pagination-utils";
import { CRM_API_PREFIX } from "@/constants/api-prefix";
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountDetailDto,
  AccountFilterParams,
  AccountBulkArchiveDto,
  AccountListResponse,
} from "@/types/CRM/account";

const ACCOUNTS_PREFIX = `${CRM_API_PREFIX}/accounts`;

export const accountService = {
  // ── Core CRUD ──────────────────────────────────────────────

  getAccounts: async (
    params: AccountFilterParams = {}
  ): Promise<AccountListResponse> => {
    return await ApiService.getWithMeta<AccountListResponse>(
      ACCOUNTS_PREFIX,
      formatPaginationParams({ ...params })
    );
  },

  getAccount: async (id: string): Promise<AccountDetailDto> => {
    return await ApiService.get<AccountDetailDto>(`${ACCOUNTS_PREFIX}/${id}`);
  },

  createAccount: async (dto: CreateAccountDto): Promise<AccountDetailDto> => {
    return await ApiService.post<AccountDetailDto>(ACCOUNTS_PREFIX, dto);
  },

  updateAccount: async (
    id: string,
    dto: UpdateAccountDto
  ): Promise<AccountDetailDto> => {
    return await ApiService.put<AccountDetailDto>(
      `${ACCOUNTS_PREFIX}/${id}`,
      dto
    );
  },

  deleteAccount: async (id: string): Promise<boolean> => {
    await ApiService.delete<void>(`${ACCOUNTS_PREFIX}/${id}`);
    return true;
  },

  // ── Bulk Operations ────────────────────────────────────────

  bulkArchive: async (dto: AccountBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(`${ACCOUNTS_PREFIX}/bulk-archive`, dto);
    return true;
  },

  bulkRestore: async (dto: AccountBulkArchiveDto): Promise<boolean> => {
    await ApiService.post<void>(`${ACCOUNTS_PREFIX}/bulk-restore`, dto);
    return true;
  },
};
